import axios from "axios";
import { Agent } from "https";
import { Service } from "typedi";
import { CoinexesMarkets } from "./models/CoinexesMarkets";
import CoinexMarketPrice from "./models/CoinexMarketPrice";
import { CoinexesMarketsUrl, coinexMarketPriceUrl } from "./Urls";


@Service({ transient: true })
export default class CoinexApi {

    async getMarkets(): Promise<CoinexesMarkets | undefined> {
        return new Promise<CoinexesMarkets | undefined>(async (resolve) => {
            try {
                let data = (await axios.get(CoinexesMarketsUrl)).data
                resolve(data)
            } catch (e) {
                console.log(e);
                resolve(undefined)
            }
        })
    }

    async getMarketPrice(market: string , limit : number): Promise<CoinexMarketPrice> {
        return new Promise<CoinexMarketPrice>(async (resolve, reject) => {
            try {
                let data = (await axios.get(coinexMarketPriceUrl, {
                    params: {
                        market: market,
                        type: '1day',
                        limit: limit
                    },
                    headers: {
                        "Content-Type": "application/json"
                    },
                    httpsAgent: new Agent({ keepAlive: true }),
                    timeout: 60000
                })).data
                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }
}