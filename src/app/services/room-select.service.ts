import { RoomInfo } from '../models/roomInfo';
import { Injectable } from '@angular/core';
import { AppConfigService } from './app-config.service';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoomSelectService {
  
  rooms!:RoomInfo[]

  constructor(private http:HttpClient,private appConfigService:AppConfigService) { }

  getRoomInfo():Observable<RoomInfo[]>{
      // return this.http.get<any>(`${this.appConfigService.apiBaseUrl}/user/rooms`)
      // .pipe(
      //   tap(_ => console.log('fetched room info'))
      // );
      return this.http.get<any>('../../assets/room_information/rooms.json')
      .pipe(
        tap(_ => console.log('fetched room info'))
      );
  }

  init(){
    let that = this;
    return this.http.get<any>('../../assets/room_information/rooms.json')
    .toPromise()
    .then(data => {
      this.rooms = data;
    });
  }

  getRoomName(id:Number):string{
    if (!this.rooms) {
      throw Error('rooms not loaded!');
    }

    for(let room of this.rooms){
      if(room.id == id){
        return room.name
      }
    }
    return ""
  }
}