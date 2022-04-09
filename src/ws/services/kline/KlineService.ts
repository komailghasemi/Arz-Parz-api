import { Service } from "typedi";
import WebSocket from "ws";
import Auth from "../../../auth/Auth";
import Message from "./Message";
import Subscriber from "../kline/Subscriber";
import Database from "../../../database/Database";
import Market from "../../../database/models/Market";
import KucoinClient from "../../exchanges/kucoin/KucoinClient";
import BittrexClient from "../../exchanges/bittrex/BittrexClient";
import BinanceClient from "../../exchanges/binance/BinanceClient";
import CoinexClient from "../../exchanges/coinex/CoinexClient";

type MessageProcess = (base: string | undefined, qoute: string | undefined, userId: string | undefined, ws: WebSocket) => void
type ExchangeProcess = (base: string, qoute: string, subscribe: boolean) => void


@Service()
export default class KlineService {

    private subscriber: Subscriber[] = []
    private actionMap = new Map<'ping' | 'subscribe' | 'unsubscribe', MessageProcess>()
    private exMap = new Map<string, ExchangeProcess>()

    constructor(private readonly database: Database, private readonly kucoinWs: KucoinClient, private readonly bittrexWs: BittrexClient, private readonly binanceWs: BinanceClient, private readonly coinexWs: CoinexClient) {
        this.garbageCollector()

        this.exMap.set('Kucoin', this.kucoin)
        this.exMap.set('Bittrex', this.bittrex)
        this.exMap.set('Binance', this.binance)
        this.exMap.set('Coinex', this.coinex)

        this.actionMap.set('ping', this.pingProcess)
        this.actionMap.set('subscribe', this.subscribeProcess)
        this.actionMap.set('unsubscribe', this.unSubscribeProcess)

        kucoinWs.setOnKlineListener((kl) => {
            this.subscriber.forEach((v, i, a) => {
                if(v.base.toLowerCase() === kl.base.toLowerCase() && v.qoute.toLowerCase() === kl.quote.toLowerCase()){
                    if (kl.history) {
                        if (v.isNew.includes('Kucoin') === false) {
                            v.isNew.push('Kucoin')
                            v.ws.send(JSON.stringify(kl))
                        }
                    } else {
                        v.ws.send(JSON.stringify(kl))
                    }
                }
            })
        })

        bittrexWs.setOnKlineListener((kl) => {
            this.subscriber.forEach((v, i, a) => {
                if(v.base.toLowerCase() === kl.base.toLowerCase() && v.qoute.toLowerCase() === kl.quote.toLowerCase()){
                    if (kl.history) {
                        if (v.isNew.includes('Bittrex') === false) {
                            v.isNew.push('Bittrex')
                            v.ws.send(JSON.stringify(kl))
                        }
                    } else {
                        v.ws.send(JSON.stringify(kl))
                    }
                }
            })
        })

        binanceWs.setOnKlineListener((kl) => {
            this.subscriber.forEach((v, i, a) => {
                if(v.base.toLowerCase() === kl.base.toLowerCase() && v.qoute.toLowerCase() === kl.quote.toLowerCase()){
                    if (kl.history) {
                        if (v.isNew.includes('Binance') === false) {
                            v.isNew.push('Binance')
                            v.ws.send(JSON.stringify(kl))
                        }
                    } else {
                        v.ws.send(JSON.stringify(kl))
                    }
                }
            })
        })

        coinexWs.setOnKlineListener((kl) => {
            this.subscriber.forEach((v, i, a) => {
                if(v.base.toLowerCase() === kl.base.toLowerCase() && v.qoute.toLowerCase() === kl.quote.toLowerCase()){
                    if (kl.history) {
                        if (v.isNew.includes('Coinex') === false) {
                            v.isNew.push('Coinex')
                            v.ws.send(JSON.stringify(kl))
                        }
                    } else {
                        v.ws.send(JSON.stringify(kl))
                    }
                }
            })
        })
    }

    put(ws: WebSocket) {
        this.onMessage(ws)
        this.onClose(ws)
    }


    private onMessage(ws: WebSocket) {
        ws.on('message', async (data, _isBinary) => {
            try {
                let message = JSON.parse(data.toString()) as Message

                let userId = await Auth.tokenValidation(message.token)
                this.actionMap.get(message.type)?.call(this, message.base, message.qoute, userId, ws)

            } catch (e) {
                console.log(e);

                ws.close(1011, 'WS Unsupported JSON Data Error\r\n\r\n')
                ws.terminate()
            }
        })
    }


    async kucoin(base: string, qoute: string, subscribe: boolean) {
        if (subscribe)
            await this.kucoinWs.subscribeKline(base, qoute)
        else
            await this.kucoinWs.unSubscribeKline(base, qoute)
    }

    async bittrex(base: string, qoute: string, subscribe: boolean) {
        if (subscribe)
            await this.bittrexWs.subscribeKline(base, qoute)
        else
            await this.bittrexWs.unSubscribeKline(base, qoute)
    }


    async binance(base: string, qoute: string, subscribe: boolean) {
        if (subscribe)
            await this.binanceWs.subscribeKline(base, qoute)
        else
            await this.binanceWs.unSubscribeKline(base, qoute)
    }

    async coinex(base: string, qoute: string, subscribe: boolean) {
        if (subscribe)
            await this.coinexWs.subscribeKline(base, qoute)
        else
            await this.coinexWs.unSubscribeKline(base, qoute)
    }

    async subscribeProcess(base: string | undefined, qoute: string | undefined, userId: string | undefined, ws: WebSocket) {

        if (userId === undefined) {
            ws.close(1007, '401 Unauthorized\r\n\r\n')
            ws.terminate()
        } else {
            if (base && qoute)
                this.subscriber.push({
                    userId: userId,
                    base: base,
                    qoute: qoute,
                    ws: ws,
                    isNew: []
                })

            // subscribe in exchange

            let market = await this.database.getManager()?.findOne(Market, {
                relations: ['Exchanges'],
                where: {
                    Symbol: `${base?.toLowerCase()}${qoute?.toLowerCase()}`
                }
            })

            market?.Exchanges?.forEach(async (value, _index, _arr) => {
                if (base && qoute)
                    this.exMap.get(value.Name!)?.call(this, base, qoute, true)
            })
        }

    }

    async unSubscribeProcess(base: string | undefined, qoute: string | undefined, userId: string | undefined, ws: WebSocket) {
        if (userId === undefined) {
            ws.close(1007, '401 Unauthorized\r\n\r\n')
            ws.terminate()
        } else {
            this.subscriber = this.subscriber.filter((value, _index, _arr) => {
                return !(value.userId === userId && value.base === base && value.qoute === qoute)
            })

            // unsubscribe from exchange

            let market = await this.database.getManager()?.findOne(Market, {
                relations: ['Exchanges'],
                where: {
                    Symbol: `${base?.toLowerCase()}${qoute?.toLowerCase()}`
                }
            })

            market?.Exchanges?.forEach(async (value, _index, _arr) => {
                if (base && qoute)
                    this.exMap.get(value.Name!)?.call(this, base, qoute, false)
            })
        }
    }

    pingProcess(_base: string | undefined, _qoute: string | undefined, _userId: string | undefined, ws: WebSocket) {
        ws.send("pong [KLINE]", { binary: false })
    }

    private onClose(ws: WebSocket) {
        ws.on('close', (_code, _reason) => {
            console.log('closed');
            this.subscriber = this.subscriber.filter((value, _index, _arr) => {
                return value.ws !== ws
            })
        })
    }

    private garbageCollector() {
        setInterval(() => {
            this.subscriber = this.subscriber.filter((value, _index, _arr) => {
                return value.ws.readyState === WebSocket.OPEN
            })
        }, 30000)
    }
}