
export default interface Message{
    type : 'subscribe' | 'unsubscribe' | 'data' | 'ping'
    channel : string | undefined
    token: string
    payload : string | undefined
}