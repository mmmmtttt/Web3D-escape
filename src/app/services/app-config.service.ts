import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {

  private appConfig: any;

  constructor(private http: HttpClient) { }

  loadAppConfig() {
    let that = this;
    return this.http.get('/assets/config/config.json')
    .toPromise()
    .then(data => {
      this.appConfig = data;
    });
  }

  get apiBaseUrl() {

    if (!this.appConfig) {
      throw Error('Config file not loaded!');
    }

    return this.appConfig.apiBaseUrl;
  }

  get apiBotUrl() {

    if (!this.appConfig) {
      throw Error('Config file not loaded!');
    }

    return this.appConfig.apiBotUrl;
  }

  get modelNum(){
    if (!this.appConfig) {
      throw Error('Config file not loaded!');
    }

    return this.appConfig.modelNum;
  }

  get apiChatUrl(){
    if (!this.appConfig) {
      throw Error('Config file not loaded!');
    }

    return this.appConfig.apiChatUrl;
  }
}