import axios from "axios";
import { Service } from "typedi";
import KucoinMarketPrice from "./models/KucoinMarketPrice";
import KucoinsMarkets from "./models/KucoinsMarkets";
import KucoinWsConnectionInfo from "./models/KucoinWsConnectionInfo";
import { kucoinMarketPriceUrl, KucoinsMarketsUrl, wsConnectionInfoUrl } from "./Urls";


@Service({ transient: true })
export default class KucoinApi {

    async getMarketPrice(base: string, quote: string): Promise<KucoinMarketPrice> {
        return new Promise<KucoinMarketPrice>(async (resolve, reject) => {
            try {
                let data = (await axios.get(kucoinMarketPriceUrl.replace(":symbol", `${base.toUpperCase()}-${quote.toUpperCase()}`))).data
                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }

    async getMarkets(): Promise<KucoinsMarkets | undefined> {
        return new Promise<KucoinsMarkets | undefined>(async (resolve) => {
            try {
                let data = (await axios.get(KucoinsMarketsUrl)).data
                resolve(data)
            } catch (e) {
                console.log(e);
                resolve(undefined)
            }
        })
    }

    async getWsConnectionInfo(): Promise<KucoinWsConnectionInfo> {
        return new Promise<KucoinWsConnectionInfo>(async (resolve, reject) => {
            try {
                let data = (await axios.post(wsConnectionInfoUrl)).data
                resolve(data)
            } catch (e) {
                reject(e)
            }
        })
    }
}