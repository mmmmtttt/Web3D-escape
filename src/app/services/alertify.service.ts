import { Injectable } from '@angular/core';
import * as alertyfy from 'alertifyjs';

@Injectable({
  providedIn: 'root'
})
export class AlertifyService {

  constructor() { }

  success(message:string,duration:number=1){
    alertyfy.success(message,duration);
  }

  warning(message:string,duration:number=1){
    alertyfy.warning(message,duration);
  }

  error(message:string,duration:number=1){
    alertyfy.error(message,duration);
  }

}
