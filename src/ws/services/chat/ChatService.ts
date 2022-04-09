import Container, { Service } from "typedi";
import { WebSocket } from "ws";
import Auth from "../../../auth/Auth";
import Database from "../../../database/Database";
import ChatRoom from "../../../database/models/ChatRoom";
import User from "../../../database/models/User";
import Message from "./Message";
import Subscriber from "./Subscriber";


type MessageProcess = (payload: string | undefined, channel: string | undefined, userId: string | undefined, ws: WebSocket) => void


@Service()
export default class ChatService {

    private subscriber: Subscriber[] = []
    private actionMap = new Map<'ping' | 'subscribe' | 'unsubscribe' | 'data', MessageProcess>()

    constructor() {
        this.garbageCollector()

        this.actionMap.set('ping', this.pingProcess)
        this.actionMap.set('data', this.dataProcess)
        this.actionMap.set('subscribe', this.subscribeProcess)
        this.actionMap.set('unsubscribe', this.unSubscribeProcess)
    }

    put(ws: WebSocket) {
        this.onMessage(ws)
        this.onClose(ws)
    }


    private onMessage(ws: WebSocket) {
        ws.on('message', async (data, _isBinary) => {
            try {
                let message = JSON.parse(data.toString()) as Message

                let userId = await Auth.tokenValidation(message.token)
                this.actionMap.get(message.type)?.call(this, message.payload, message.channel, userId, ws)

            } catch (e) {
                console.log(e);

                ws.close(1011, 'WS Unsupported JSON Data Error\r\n\r\n')
                ws.terminate()
            }
        })
    }


    async dataProcess(payload: string | undefined, channel: string | undefined, userId: string | undefined, ws: WebSocket) {
        if (userId === undefined) {
            ws.close(1007, '401 Unauthorized\r\n\r\n')
            ws.terminate()
        } else {
            let manager = Container.get(Database).getManager()
            // save message and send to other
            let user = await manager?.findOne(User, {
                where: {
                    ClientId: userId
                }
            })

            let chat = new ChatRoom()
            chat.CreateAt = new Date()
            chat.Message = payload
            chat.Channel = channel
            chat.User = user

            await manager?.save(chat)

            this.subscriber.filter((value, _index, _arr) => {
                return value.channel === channel
            }).forEach(function each(client) {
                client.ws.send(JSON.stringify({
                    user: chat.User?.Name || "بدون نام",
                    message: chat.Message,
                    createAt: chat.CreateAt
                }), { binary: false });
            })
        }
    }

    subscribeProcess(_payload: string | undefined, channel: string | undefined, userId: string | undefined, ws: WebSocket) {

        if (userId === undefined) {
            ws.close(1007, '401 Unauthorized\r\n\r\n')
            ws.terminate()
        } else {
            if (channel)
                this.subscriber.push({
                    userId: userId,
                    channel: channel,
                    ws: ws
                })
        }

    }

    unSubscribeProcess(_payload: string | undefined, channel: string | undefined, userId: string | undefined, ws: WebSocket) {
        if (userId === undefined) {
            ws.close(1007, '401 Unauthorized\r\n\r\n')
            ws.terminate()
        } else {
            this.subscriber = this.subscriber.filter((value, _index, _arr) => {
                return !(value.userId === userId && value.channel === channel)
            })
        }
    }

    pingProcess(_payload: string | undefined, _channel: string | undefined, _userId: string | undefined, ws: WebSocket) {
        ws.send("pong [CHAT]", { binary: false })
    }

    private onClose(ws: WebSocket) {
        ws.on('close', (_code, _reason) => {
            console.log('closed');
            this.subscriber = this.subscriber.filter((value, _index, _arr) => {
                return value.ws !== ws
            })
        })
    }


    private garbageCollector() {
        setInterval(() => {
            this.subscriber = this.subscriber.filter((value, _index, _arr) => {
                return value.ws.readyState === WebSocket.OPEN
            })
        }, 30000)
    }
}