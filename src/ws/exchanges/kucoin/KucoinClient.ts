import { Service } from "typedi";
import KucoinApi from "../../../api/KucoinApi";
import { saveError } from "../../../error/ErrorHandler";
import KlineResponse from "../responses/KlineResponses";
import { websocket } from "../websocket";
import { v4 as uuidv4 } from 'uuid';

@Service()
export default class KucoinClient {
    private onKline: ((k: KlineResponse) => void) | undefined

    private subscribed = new Map<string, string>()
    private messageId = 0
    private pingInterval = 15000
    private pendingMessage: any[] = []
    private isConnected = false
    private isConnecting = false
    private reconnect = false
    private timer: NodeJS.Timer | undefined
    constructor(private readonly ws: websocket, private readonly api: KucoinApi) {

        this.ws.on('connected', () => {
            this.isConnected = true
            this.isConnecting = false
            if (this.reconnect) {
                this.reconnect = false
                this.onReconnect()
            } else
                this.onConnected()

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
                    let info = await this.api.getWsConnectionInfo()

                    if (info) {
                        this.pingInterval = info.data.instanceServers[0].pingInterval
                        let url = `${info.data.instanceServers[0].endpoint}?token=${info.data.token}&connectId=${uuidv4()}`
                        this.ws.connect(url)
                    } else {
                        this.isConnecting = false
                    }
                } else {
                    this.onConnected()
                }
                resolve()
            } catch (e) {
                console.log('err');
                await saveError(e)
                reject(e)
            }

        })
    }


    private onConnected() {
        while (this.pendingMessage.length !== 0) {
            let message = this.pendingMessage.shift()
            this.ws.send(message).catch(e => {
                this.pendingMessage.push(message!!)
            })
        }

        if (this.subscribed.size === 0)
            this.disconnect()
    }

    private onReconnect() {
        this.subscribed.forEach((_value, key, _map) => {
            this.reSubscribe(key)
        })
    }

    private reSubscribe(chnn: String) {
        let kwr = {
            id: ++this.messageId,
            type: "subscribe",
            topic: chnn,
            privateChannel: false,
            response: true
        }
        this.ws.send(kwr).catch(e => {
            this.reSubscribe(chnn)
        })
    }

    async subscribeKline(base: string, quote: string) {

        let chnn = `/market/candles:${base.toUpperCase()}-${quote.toUpperCase()}_1day`
        // get price
        try{
            await this.initPrice(base, quote)
        }catch{

        }

        let kwr = {
            id: ++this.messageId,
            type: "subscribe",
            topic: chnn,
            privateChannel: false,
            response: true
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
        let price = await this.api.getMarketPrice(base, quote)

        if (price) {
            let response = {
                high: price.data[0][3],
                low: price.data[0][4],
                open: price.data[0][1],
                close: price.data[0][2],
                startAt: new Date(price.data[0][0] * 1000),
                base: base,
                quote: quote,
                vol: price.data[0][5],
                qVol: price.data[0][6],
                exchange: "Kucoin",
                history : price.data.map((value , index , arr) => {
                    return value[2]
                }).reverse().slice(-100)
            }            
            this.onKline?.call(this, response)
        }


    }


    async unSubscribeKline(base: string, quote: string) {
        let chnn = `/market/candles:${base.toUpperCase()}-${quote.toUpperCase()}_1day`

        let kwr = {
            id: ++this.messageId,
            type: "unsubscribe",
            topic: chnn,
            privateChannel: false,
            response: true
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
                let chnn = this.subscribed.get(kline.topic)

                let market = chnn!!.split(":")
                let response = {
                    high: kline.data.candles[3],
                    low: kline.data.candles[4],
                    open: kline.data.candles[1],
                    close: kline.data.candles[2],
                    startAt: new Date(+kline.data.candles[0] * 1000),
                    base: market[0],
                    quote: market[1],
                    vol: kline.data.candles[5],
                    qVol: kline.data.candles[6],
                    exchange: "Kucoin",
                    history : undefined
                }
                this.onKline?.call(this, response)

            }
        } catch {
        }
    }

    private sendPing() {

        this.timer = setInterval(() => {
            let ping = {
                id: ++this.messageId,
                type: 'ping'
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