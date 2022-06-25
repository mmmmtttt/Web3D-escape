import { AuthService } from './../../services/auth.service';
import { ChatEvent } from './../../models/chatMessage';
import { ChatMessage } from '../../models/chatMessage';
import { ChatService } from './../../services/chat.service';
import { Component, OnInit, Input } from '@angular/core';
import { WebsocketService } from 'src/app/services/websocket.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  @Input()
  roomId!: number;

  messageList: ChatMessage[] = [];
  message = ''; //输入框中的内容
  hideChatBox: boolean = true;

  constructor(private webSocketService: WebsocketService, private chatService: ChatService, private authService: AuthService) { }

  ngOnInit(): void {
    if (!this.webSocketService.socket) { //如果还没定义（因为game-sync-service里也要用 不知道那边先初始化）
      this.webSocketService.connect(this.roomId);
    }
    //增加到messageList的最前
    this.chatService.listenMessage(ChatEvent.connect).subscribe((message) => this.messageList.splice(0, 0, message));
    this.chatService.listenMessage(ChatEvent.message).subscribe((message) => this.messageList.splice(0, 0, message));
    this.chatService.listenMessage(ChatEvent.disconnect).subscribe((message) => this.messageList.splice(0, 0, message));
  }

  sendMessage() {
    if (this.message.length > 0) {
      let msg = { username: this.authService.username, message: this.message };
      this.chatService.emit(ChatEvent.message, msg);
      this.message = '';
    }
  }

  // closeBox(
  //   chatbox: HTMLDivElement,
  //   btn: HTMLButtonElement,
  //   overlay: HTMLDivElement
  // ){
  //   gsap.to(overlay, {
  //     duration: 0,
  //     autoAlpha: 0,
  //   });
  //   gsap.to(btn, {
  //     duration: 0.4,
  //     autoAlpha: 1,
  //     x:0,
  //     y:0,
  //     ease: Expo.easeInOut as any,
  //   });
  //   gsap.to(chatbox, {
  //     duration: 0.3,
  //     width: 0,
  //     height: 0,
  //     scale: 0.4,
  //     autoAlpha: 0,
  //     borderRadius: 0,
  //     ease: Expo.easeInOut as any,
  //   });
  //   gsap.from(chatbox.children, {
  //     duration: 0,
  //     autoAlpha: 1,
  //     ease: Expo.easeInOut as any,
  //   });
  // }

  // showBox(
  //   chatbox: HTMLDivElement,
  //   btn: HTMLButtonElement,
  //   overlay: HTMLDivElement
  // ) {
  //   gsap.to(overlay, {
  //     duration: 0,
  //     autoAlpha: 1,
  //     zIndex:1000,
  //   });
  //   gsap.to(btn, {
  //     duration: 0.3,
  //     x:-20,
  //     y:-50,
  //     autoAlpha: 0,
  //     ease: Expo.easeInOut as any,
  //   });
  //   gsap.to(chatbox, {
  //     duration: 0.4,
  //     scale: 1,
  //     height:600,
  //     width:300,
  //     autoAlpha: 1,
  //     borderRadius: '15px',
  //     zIndex:3000,
  //     ease: Expo.easeInOut as any,
  //   });
  //   gsap.from(chatbox.children, {
  //     delay: 0.1,
  //     autoAlpha: 0,
  //     zIndex:4000,
  //     ease: Expo.easeInOut as any,
  //   });
  // }
}
