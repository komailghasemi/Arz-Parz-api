
export default interface BinancesMarkets{

      timezone: string,
      serverTime: number,
      rateLimits: any[],
      exchangeFilters: any[],
      symbols: Symbols[]
    
}

interface Symbols{
        symbol: string,
        status: string,
        baseAsset: string,
        baseAssetPrecision: number,
        quoteAsset: string,
        quoteAssetPrecision: number,
        baseCommissionPrecision: number,
        quoteCommissionPrecision: number,
        orderTypes: string[],
        icebergAllowed: boolean,
        ocoAllowed: boolean,
        quoteOrderQtyMarketAllowed: boolean,
        isSpotTradingAllowed: boolean,
        isMarginTradingAllowed: boolean,
        filters: any[],
        permissions: string[]
}
