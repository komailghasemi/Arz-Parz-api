import { Service } from "typedi";
import CoinMarketCapApi from "../api/CoinMarketCapApi";
import Database from "../database/Database";
import GlobalMetrics from "../database/models/GlobalMetrics";


@Service({ transient: true })
export default class GlobalMetricsJob {

    constructor(private readonly database: Database, private readonly api: CoinMarketCapApi) {
    }

    async sync() {
        console.log('starting global metrics job ...');

        let data = await this.api.getGlobalMetrics(process.env.COIN_MARKET_CAP_API_KEY)

        if (data === undefined || data.status.error_message)
            return

        let repo = this.database.getManager()
        let gm = await repo?.findOne(GlobalMetrics) || new GlobalMetrics()

        gm.ActiveCryptocurrencies = data.data.active_cryptocurrencies
        gm.ActiveExchanges = data.data.active_exchanges
        gm.AltcoinMarketCap = data.data.quote.USD.altcoin_market_cap
        gm.AltcoinVolume24h = data.data.quote.USD.altcoin_volume_24h
        gm.BtcDominance = data.data.btc_dominance
        gm.DefiMarketCap = data.data.defi_market_cap
        gm.DefiVolume24h = data.data.defi_volume_24h
        gm.EthDominance = data.data.eth_dominance
        gm.StablecoinMarketCap = data.data.stablecoin_market_cap
        gm.StablecoinVolume24h = data.data.stablecoin_volume_24h
        gm.TotalMarketCap = data.data.quote.USD.total_market_cap
        gm.TotalVolume24h = data.data.quote.USD.total_volume_24h
        gm.UpdateAt = new Date()
        
        repo?.save(gm)
    }
}