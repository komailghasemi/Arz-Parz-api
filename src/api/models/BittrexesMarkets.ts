
export default interface BittrexesMarkets {
    symbol: string,
    baseCurrencySymbol: string,
    quoteCurrencySymbol: string,
    minTradeSize: number,
    precision: number,
    status: string,
    createdAt: Date,
    prohibitedIn: string[],
    associatedTermsOfService: string[],
    tags: string[]
}