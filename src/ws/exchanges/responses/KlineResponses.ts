

export default interface KlineResponse {
    high: number,
    low: number,
    open: number,
    close: number,
    startAt: Date,
    base: string,
    quote: string,
    vol: number,
    qVol: number,
    exchange: string,
    history : number[] | undefined
}