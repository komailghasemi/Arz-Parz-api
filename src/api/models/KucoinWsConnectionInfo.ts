

export default interface KucoinWsConnectionInfo{
    code: number
    data: WsConnectionData
}

interface  WsConnectionData{
    token: String,
    instanceServers: InstanceServers[]
}


interface InstanceServers{
    endpoint: string,
    encrypt: boolean,
    protocol: string,
    pingInterval: number,
    pingTimeout: number
}