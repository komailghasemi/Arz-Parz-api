import { WebSocket } from "ws";

export default interface Subscriber{
    ws : WebSocket
    userId : string
    channel : string
}
