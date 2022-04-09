import EventEmitter from "events";
import { Service } from "typedi";
import WebSocket from 'ws'

@Service({ transient: true })
export class websocket extends EventEmitter {

    private wss: WebSocket | undefined
    private handshakeTimeOut = 15000
    connect(url: string) {

        this.wss = new WebSocket(url, {
            perMessageDeflate: false,
            handshakeTimeout: this.handshakeTimeOut
        });

        this.wss.on("open", () => {
            this.emit('connected')
        })
        this.wss.on('error', (e) => {
            this.emit('error', e)
        })

        this.wss.on('close', (code, reason) => {
            this.emit('close', code, reason)
        })
        this.wss.on('message', (msg) => this.emit('message', msg))
    }



    async send(data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.wss) {
                this.wss?.send(JSON.stringify(data), (err) => {
                    if (err)
                        reject(err)
                    else
                        resolve()
                })
            }
            else
                reject('web socket closed')
        })
    }

    close() {
        try {
         //   this.removeAllListeners()
            this.wss?.removeAllListeners()
            this.wss?.terminate()
        } catch {

        }
    }
}