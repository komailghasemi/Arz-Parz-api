

export default interface Crypto {
    coins?: Coin[]
}

export interface Coin {
    id: string
    name: string,
    symbol: string,
    market_cap_rank: number,
    thumb: string,
    large: string
}