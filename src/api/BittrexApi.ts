import axios from "axios";
import { Service } from "typedi";
import BittrexesMarkets from "./models/BittrexesMarkets";
import BittrexMarketPrice from "./models/BittrexMarketPrice";
import { BittrexesMarketsUrl, bittrexMarketPriceUrl } from "./Urls";


@Service({ transient: true })
export default class BittrexApi {

    async getMarkets(): Promise<[BittrexesMarkets] | undefined> {
        return new Promise<[BittrexesMarkets] | undefined>(async (resolve) => {
            try {
                let data = (await axios.get(BittrexesMarketsUrl)).data
                resolve(data)
            } catch (e) {
                console.log(e);
                resolve(undefined)
            }
        })
    }


    async getMarketPrice(base: string, quote: string): Promise<[BittrexMarketPrice]> {
        return new Promise<[BittrexMarketPrice]>(async (resolve, reject) => {
            try {
                let data = (await axios.get(bittrexMarketPriceUrl.replace(":symbol", `${base.toUpperCase()}-${quote.toUpperCase()}`))).data
                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }
}