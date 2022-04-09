import { Service } from "typedi";
import CoinexApi from "../../../api/CoinexApi";
import delay from "../../../utils/delay";
import KlineResponse from "../responses/KlineResponses";
import { websocket } from "../websocket";

@Service()
export default class BinanceClient {
    private onKline: ((k: KlineResponse) => void) | undefined
    private subscribed = new Map<string, string>()
    private messageId = 0
    private pingInterval = 30000
    private isConnected = false
    private isConnecting = false
    private timer: NodeJS.Timer | undefined
    private marketUpdateQueue: string[] = []

    
    constructor(private readonly ws: websocket, private readonly api: CoinexApi) {

        this.ws.on('connected', () => {
            this.isConnected = true
            this.isConnecting = false
            this.onConnected()
            this.processMarketUpdateQueue()
            this.sendPing()
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
                clearInterval(this.timer!!)
                this.isConnected = false
                this.isConnecting = false
            }

        })
    }



    private onError() {
        clearInterval(this.timer!!)
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

                    this.ws.connect('wss://socket.coinex.com/')

                } else {
                    this.onConnected()
                }
                resolve()
            } catch (e) {
                console.log('err');

                reject(e)
            }

        })
    }

    private onConnected() {
        let req = {
            method: "state.subscribe",
            params: Array.from(this.subscribed.keys()),
            id: ++this.messageId
        }
        this.ws.send(req).catch(e => {
            this.onError()
        })

        if (this.subscribed.size === 0)
            this.disconnect()
    }



    async subscribeKline(base: string, quote: string) {

        let chnn = `${base.toUpperCase()}${quote.toUpperCase()}`
        // get price
        try{
            await this.initPrice(base, quote)
        }catch{

        }

        this.subscribed.set(chnn, `${base}:${quote}`)
        try {
            await this.connect()
        } catch {
            this.onError()
        }
    }


    private async initPrice(base: string, quote: string) {
        let kline = await this.api.getMarketPrice(`${base}${quote}` , 365)        
        let response = {
            high: kline.data[kline.data.length - 1][3],
            low: kline.data[kline.data.length - 1][4],
            open: kline.data[kline.data.length - 1][1],
            close: kline.data[kline.data.length - 1][2],
            startAt: new Date(kline.data[kline.data.length - 1][0] * 1000),
            base: base,
            quote: quote,
            vol: kline.data[kline.data.length - 1][5],
            qVol: kline.data[kline.data.length - 1][6],
            exchange: "Coinex",
            history : kline.data.map((value , index , arr) => {
                return value[2]
            }).slice(-100)

        }

        this.onKline?.call(this, response)

    }

    async unSubscribeKline(base: string, quote: string) {
        let chnn = `${base.toUpperCase()}${quote.toUpperCase()}`
        this.subscribed.delete(chnn)
        try {
            await this.connect()
        } catch {
            this.onError()
        }
    }

    private onMessage(text: string) {
        try {
            let kline = JSON.parse(text)
            if (kline != null && kline.method == "state.update") {
                let market = Object.keys(kline.params[0])[0]
                if (market) {
                    this.marketUpdateQueue.push(market)
                }
            }
        } catch {
        }
    }

    private async processMarketUpdateQueue() {
        return Promise.resolve().then(async () => {
            let pair = this.marketUpdateQueue.shift()
            if (pair) {
                let kline = await this.api.getMarketPrice(pair , 1)
                let chnn = this.subscribed.get(pair)
                let market = chnn!!.split(":")

                let response = {
                    high: kline.data[0][3],
                    low: kline.data[0][4],
                    open: kline.data[0][1],
                    close: kline.data[0][2],
                    startAt: new Date(kline.data[0][0] * 1000),
                    base: market[0],
                    quote: market[1],
                    vol: kline.data[0][5],
                    qVol: kline.data[0][6],
                    exchange: "Coinex",
                    history : undefined

                }

                this.onKline?.call(this, response)
            }

        }).then(() => process.nextTick(async () => {
            if (this.marketUpdateQueue.length === 0) {
                await delay(5000)
            }
            if (this.isConnected)
                await this.processMarketUpdateQueue()
        })).catch(async () => {
            if (this.isConnected)
                await this.processMarketUpdateQueue()
        })
    }

    private sendPing() {

        this.timer = setInterval(() => {
            let ping = {
                method: 'server.ping',
                params: [],
                id: ++this.messageId
            }
            this.ws.send(ping).catch(console.log)
        }, this.pingInterval)


    }
    setOnKlineListener(kline: (kl: KlineResponse) => void) {
        this.onKline = kline
    }


    private disconnect() {
        console.log('disconnect');
        this.isConnected = false
        this.isConnecting = false
        clearInterval(this.timer!!)
        this.ws.close()
    }
}