import { AuthService } from './auth.service';
import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import * as io from 'socket.io-client';
@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  public socket:any;
  private url!:string;
  private namespace:string = "user";

  constructor(private appConfigService:AppConfigService,private authService:AuthService) { 
    
  }

  connect(roomId:number){
    this.url = `${this.appConfigService.apiChatUrl}/${this.namespace}?room=${roomId}&token=${this.authService.token}`;
    this.socket = io.connect(this.url, { transports: ['websocket', 'xhr-polling', 'jsonp-polling']});
  }
}
