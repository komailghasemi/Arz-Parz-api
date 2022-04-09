import { WebSocket } from "ws";

export default interface Subscriber{
    ws : WebSocket
    userId : string
    base : string 
    qoute : string
    isNew : string[]
}
