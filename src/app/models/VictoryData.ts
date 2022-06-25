export interface VictoryData{
    winnerId:number,
    achievement:achievement[]
}

export interface achievement{
    socketId:number,
    checkpoint:number
}