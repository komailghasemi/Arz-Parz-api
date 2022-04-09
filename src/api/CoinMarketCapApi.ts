import axios from "axios";
import { Service } from "typedi";
import Crypto from "./models/Crypto";
import GlobalMetrics from "./models/GlobalMetrics";
import { CryptosUrl, GlobalMetricsUrl } from "./Urls";


@Service({ transient: true })
export default class CoinMarketCapApi {

    async getGlobalMetrics(apiKey?: string): Promise<GlobalMetrics | undefined> {
        return new Promise<GlobalMetrics | undefined>(async (resolve) => {
            try {
                let data = (await axios.get(GlobalMetricsUrl, {
                    params: {
                        CMC_PRO_API_KEY: apiKey
                    }
                })).data
                resolve(data)
            } catch (e) {
                console.log(e);
                resolve(undefined)
            }
        })
    }
}