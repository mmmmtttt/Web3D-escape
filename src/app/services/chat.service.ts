import { WebsocketService } from './websocket.service';
import { ChatEvent } from './../models/chatMessage';
import { AuthService } from './auth.service';
import { ChatMessage } from '../models/chatMessage';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/* 暂且不用它，用了它有奇怪的bug(在chrome同时打开两个tab，先打开的那个收不到消息) */
@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private webSocketService:WebsocketService,private authService:AuthService) { }

  listenMessage(eventName: string){
    return new Observable<ChatMessage>((subscriber) => { //当 Observable 初始订阅的时候会调用该方法
      this.webSocketService.socket.on(eventName,(data:any) => {
        if(data != undefined && data != 'io client disconnect'){//不是客户端主动发起的
          let jsonObj: any = JSON.parse(data); // string to generic object first
          let msg = (<ChatMessage>jsonObj);
          if(eventName==ChatEvent.message){//如果是对话，分清是谁的
            msg['type'] = msg.username == this.authService.username? "mine": "others"; 
          } else{//如果只是加入离开
            msg['type'] = eventName;
          }
          subscriber.next(msg); //新的值产生，通知subscriber
        }
      });
    });
  }

  emit(eventName: string, data: any) {
    this.webSocketService.socket.emit(eventName, data);
  }
}
