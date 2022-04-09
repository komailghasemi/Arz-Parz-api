
export default interface GlobalMetrics {
    status: {
        timestamp: Date,
        error_code: number,
        error_message?: string,
        elapsed: number,
        credit_count: number,
        notice?: string
    },
    data: {
        active_cryptocurrencies: number,
        active_exchanges: number,
        eth_dominance: number,
        btc_dominance: number,
        defi_volume_24h: number,
        defi_market_cap: number,
        stablecoin_volume_24h: number,
        stablecoin_market_cap: number,
        quote: {
            USD: {
                total_market_cap: number,
                total_volume_24h: number,
                altcoin_volume_24h: number,
                altcoin_market_cap: number
            }
        }
    }
}