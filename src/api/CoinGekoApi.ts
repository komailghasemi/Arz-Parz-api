import axios from "axios";
import { Service } from "typedi";
import Crypto from "./models/Crypto";
import { CryptosUrl } from "./Urls";

@Service()
export default class CoinGekoApi{

    async getCryptos(): Promise<Crypto | undefined>{
        return new Promise<Crypto | undefined>(async (resolve) => {
            try {
                let data = (await axios.get(CryptosUrl)).data
                resolve(data)
            } catch (e) {
                console.log(e);
                resolve(undefined)
            }
        })
    }

}