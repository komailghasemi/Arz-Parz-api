import { Service } from "typedi";
import KlineResponse from "../responses/KlineResponses";
import { websocket } from "../websocket";
import zlib from "zlib";
import BittrexApi from "../../../api/BittrexApi";


@Service()
export default class BittrexClient {

    private onKline: ((k: KlineResponse) => void) | undefined
    private subscribed = new Map<string, string>()
    private messageId = 0
    private pendingMessage: any[] = []
    private isConnected = false
    private isConnecting = false
    private reconnect = false
    private hub = "c3"
    private connectionToken =
        "r2rgeUqrnQKC2QDNXVUGkTAmrYWJxdaEbAKFpI7XG/l/hDBh6P6QoTtgrLmVkAva0a4yve8Ir8ScrzsXA2eRsGE0y9Gy9gjQfxKDCpl2L9wFSnI2"

    constructor(private readonly ws: websocket, private readonly api: BittrexApi) {
        this.ws.on('connected', () => {
            this.isConnected = true
            this.isConnecting = false
            if (this.reconnect) {
                this.reconnect = false
                this.onReconnect()
            } else
                this.onConnected()
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
                    this.ws.connect(`wss://socket-v3.bittrex.com/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionToken=${this.connectionToken}&connectionData=[{\"name\":\"${this.hub}\"}]&tid=${new Date().getTime()}`)

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
            H: this.hub,
            M: "Subscribe",
            A: [[chnn]],
            I: ++this.messageId
        }
        this.ws.send(kwr).catch(e => {
            this.reSubscribe(chnn)
        })
    }


    async subscribeKline(base: string, quote: string) {

        let chnn = `candle_${base.toUpperCase()}-${quote.toUpperCase()}_DAY_1`
        // get price
        try{
            await this.initPrice(base, quote)
        }catch{

        }
     

        let kwr = {
            H: this.hub,
            M: "Subscribe",
            A: [[chnn]],
            I: ++this.messageId
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

        if(price){
            let response = {
                high: price[price.length - 1].high,
                low: price[price.length - 1].low,
                open: price[price.length - 1].open,
                close: price[price.length - 1].close,
                startAt: new Date(price[price.length - 1].startsAt),
                base: base,
                quote: quote,
                vol: price[price.length - 1].volume,
                qVol: price[price.length - 1].quoteVolume,
                exchange: "Bittrex",
                history : price.map((value , index , arr) => {
                    return value.close
                }).slice(-100)
            }
            
            this.onKline?.call(this, response)
        }


    }

    async unSubscribeKline(base: string, quote: string) {
        let chnn = `candle_${base.toUpperCase()}-${quote.toUpperCase()}_DAY_1`

        let kwr = {
            H: this.hub,
            M: "Unsubscribe",
            A: [[chnn]],
            I: ++this.messageId
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
            let zip = JSON.parse(text)
            if (zip != null) {
                for (const msg of zip.M || []) {
                    for (const a of msg.A) {
                        zlib['inflateRaw'](Buffer.from(a, "base64"), (err, raw) => {
                            let kline = JSON.parse(raw as any)
                            let chnn = this.subscribed.get(`candle_${kline.marketSymbol}_DAY_1`)
                            let market = chnn!!.split(":")
                            let response = {
                                high: kline.delta.high,
                                low: kline.delta.low,
                                open: kline.delta.open,
                                close: kline.delta.close,
                                startAt: kline.delta.startsAt,
                                base: market[0],
                                quote: market[1],
                                vol: kline.delta.volume,
                                qVol: kline.delta.quoteVolume,
                                exchange: "Bittrex",
                                history : undefined
                            }

                            this.onKline?.call(this, response)
                        });

                    }

                }
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