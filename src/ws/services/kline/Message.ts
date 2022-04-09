
export default interface Message{
    type : 'subscribe' | 'unsubscribe' | 'ping'
    base : string | undefined
    qoute : string | undefined
    token: string
}