
export default interface KucoinsMarkets{
    code: number,
    data: Symbols[]
}

interface Symbols{
    symbol: string,
    name: string,
    baseCurrency: string,
    quoteCurrency: string,
    feeCurrency: string,
    market: string,
    baseMinSize: number,
    quoteMinSize: number,
    baseMaxSize: number,
    quoteMaxSize: number,
    baseIncrement: number,
    quoteIncrement: number,
    priceIncrement: number,
    priceLimitRate: number,
    isMarginEnabled: Boolean,
    enableTrading: Boolean
}