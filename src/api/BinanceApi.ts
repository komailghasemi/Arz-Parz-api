import axios from "axios";
import { Service } from "typedi";
import BinancesMarkets from "./models/BinancesMarkets";
import { binanceMarketPriceUrl, BinanceMarketsUrl } from "./Urls";



@Service({ transient: true })
export default class BinanceApi {

    async getMarkets(): Promise<BinancesMarkets | undefined> {
        return new Promise<BinancesMarkets | undefined>(async (resolve) => {
            try {
                let data = (await axios.get(BinanceMarketsUrl)).data
                resolve(data)
            } catch (e) {
                console.log(e);
                resolve(undefined)
            }
        })
    }

    async getMarketPrice(base: string, quote: string): Promise<[number[]]> {
        return new Promise<[number[]]>(async (resolve, reject) => {
            try {
                let data = (await axios.get(binanceMarketPriceUrl.replace(":symbol", `${base.toUpperCase()}${quote.toUpperCase()}`))).data
                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }
}