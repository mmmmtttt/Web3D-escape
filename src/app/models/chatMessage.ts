export interface ChatMessage extends Record<string,any>{ //record使得可以动态增加属性
    username : string;
    message : string;
    // 待补充
}

export enum ChatEvent{
    connect = "connect",
    disconnect = "disconnect",
    message = "message"
}