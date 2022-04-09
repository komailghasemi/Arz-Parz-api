export interface CoinexesMarkets {
    code: number
    message: string
    data: any
}
export interface Info {
    taker_fee_rate: number
    pricing_name: string
    trading_name: string
    min_amount: number
    name: string
    trading_decimal: number
    maker_fee_rate: number
    pricing_decimal: number
}