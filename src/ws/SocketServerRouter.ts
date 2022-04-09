import { Server } from "http";
import Container, { Service } from "typedi";
import WebSocket, { WebSocketServer } from "ws";
import ChatService from "./services/chat/ChatService";
import Database from "../database/Database";
import Error from "../database/models/Error";
import KlineService from "./services/kline/KlineService";

type RouterProcess = (ws: WebSocket) => void


@Service()
export default class SocketServerRouter {
    private wss: WebSocketServer | undefined
    private routers = new Map<string, RouterProcess>()

    constructor(private readonly chatService: ChatService , private readonly klineService : KlineService) { }

    listen(server: Server) {
        this.wss = new WebSocketServer({ server: server });

        this.routers.set('/kline', this.kline)
        this.routers.set('/chat', this.chat)


        this.wss.on('connection', (ws, req) => {
            console.log(req.url);
            if (req.url) {
                let router = this.routers.get(req.url)
                if (router)
                    router.call(this, ws)
                else {
                    ws.close(1007, 'Wrong Route\r\n\r\n')
                    ws.terminate()
                }
            }
            else {
                ws.close(1007, 'Wrong Route\r\n\r\n')
                ws.terminate()
            }

        })

        this.wss.on('error', async (err) => {
            let error = new Error()
            error.Name = err.name
            error.Message = err.message
            error.StackTrace = err.stack

            await Container.get(Database).getManager()?.save(error)
        })
    }


    private kline(ws: WebSocket) {
        this.klineService.put(ws)
    }

    private chat(ws: WebSocket) {
        this.chatService.put(ws)
    }

}