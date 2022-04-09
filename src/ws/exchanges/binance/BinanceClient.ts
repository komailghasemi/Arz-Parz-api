import { Service } from "typedi";
import BinanceApi from "../../../api/BinanceApi";
import { saveError } from "../../../error/ErrorHandler";
import delay from "../../../utils/delay";
import KlineResponse from "../responses/KlineResponses";
import { websocket } from "../websocket";



@Service()
export default class BinanceClient {
    private onKline: ((k: KlineResponse) => void) | undefined
    private subscribed = new Map<string, string>()
    private messageId = 0
    private pendingMessage: any[] = []
    private isConnected = false
    private isConnecting = false
    private reconnect = false

    constructor(private readonly ws: websocket, private readonly api: BinanceApi) {
        this.ws.on('connected', async () => {

            
            this.isConnected = true
            this.isConnecting = false
            if (this.reconnect) {
                this.reconnect = false
                this.onReconnect()
            } else
                await this.onConnected()
        })

        this.ws.on('error', (e) => {
            this.onError()
        })


        this.ws.on('message', (msg) => {
            this.onMessage(msg)
        })

        this.ws.on('close', (code, reason) => {
            if (this.subscribed.size !== 0)
                this.onError()
            else {
                this.isConnected = false
                this.isConnecting = false
            }
        })
    }

    private onError() {
        this.reconnect = this.isConnected
        this.isConnected = false
        this.isConnecting = false
        setTimeout(async () => {
            try {
                await this.connect()
            } catch {
                this.onError()
            }
        }, 10000)
    }

    private async connect(): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (!this.isConnected && !this.isConnecting) {                    
                    this.isConnecting = true
                    this.ws.connect(`wss://stream.binance.com:9443/stream`)

                } else {
                    await this.onConnected()
                }
                resolve()
            } catch (e) {
                console.log('err');
                await saveError(e)
                reject(e)
            }

        })
    }


    private async onConnected() {
        while (this.pendingMessage.length !== 0) {
            let message = this.pendingMessage.shift()
            
            await delay(1000)
            this.ws.send(message).catch(e => {                
                this.pendingMessage.push(message!!)
            })
        }

        if (this.subscribed.size === 0)
            this.disconnect()
    }

    private onReconnect() {
        this.reSubscribe()
    }


    private reSubscribe() {
        let kwr = {
            params: Array.from(this.subscribed.keys()),
            id: ++this.messageId,
            method: "SUBSCRIBE"
        }
        this.ws.send(kwr).catch(e => {
            this.reSubscribe()
        })
    }

    async subscribeKline(base: string, quote: string) {

        let chnn = `${base.toLowerCase()}${quote.toLowerCase()}@kline_1d`
        // get price
        try{
            await this.initPrice(base, quote)
        }catch{

        }

        let kwr = {
            params: [chnn],
            id: ++this.messageId,
            method: "SUBSCRIBE"
        }
        this.subscribed.set(chnn, `${base}:${quote}`)
        if (this.pendingMessage.length === 0) {
            this.pendingMessage.push(kwr)
            try {
                await this.connect()
            } catch {

                this.onError()
            }
        } else
            this.pendingMessage.push(kwr)
    }

    private async initPrice(base: string, quote: string) {
        await delay(1000)
        let price = await this.api.getMarketPrice(base, quote)

        if(price){
            let response = {
                high: price[price.length - 1][2],
                low: price[price.length - 1][3],
                open: price[price.length - 1][1],
                close: price[price.length - 1][4],
                startAt: new Date(price[price.length - 1][0]),
                base: base,
                quote: quote,
                vol: price[price.length - 1][5],
                qVol: price[price.length - 1][7],
                exchange: "Binance",
                history : price.map((value , index , arr) => {
                    return value[4]
                }).slice(-100)
            }
            
            this.onKline?.call(this, response)
        }

    }


    async unSubscribeKline(base: string, quote: string) {
        let chnn = `${base.toLowerCase()}${quote.toLowerCase()}@kline_1d`

        let kwr = {
            params: [chnn],
            id: ++this.messageId,
            method: "UNSUBSCRIBE"
        }
        this.subscribed.delete(chnn)
        if (this.pendingMessage.length === 0) {
            this.pendingMessage.push(kwr)
            try {
                await this.connect()
            } catch {
                this.onError()
            }
        } else
            this.pendingMessage.push(kwr)
    }

    private onMessage(text: string) {
        
        try {
            let kline = JSON.parse(text)
            if (kline != null) {
                let chnn = this.subscribed.get(kline.stream)

                let market = chnn!!.split(":")
                let response = {
                    high: kline.data.k.h,
                    low: kline.data.k.l,
                    open: kline.data.k.o,
                    close: kline.data.k.c,
                    startAt: new Date(+kline.data.k.t!!),
                    base: market[0],
                    quote: market[1],
                    vol: kline.data.k.v,
                    qVol: kline.data.k.q,
                    exchange: "Binance",
                    history : undefined
                }
                this.onKline?.call(this, response)

            }
        } catch {
        }
    }


    setOnKlineListener(kline: (kl: KlineResponse) => void) {
        this.onKline = kline
    }


    private disconnect() {
        console.log('disconnect');
        this.isConnected = false
        this.isConnecting = false
        this.ws.close()
    }

}