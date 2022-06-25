import { Action } from "../game/model/Player";

export interface Position{
    socketId?:number,
    x:number,
    y:number,
    z:number,
    rotation: THREE.Quaternion,
    action: Action
}