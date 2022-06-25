import { AppConfigService } from './app-config.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private url;
  private token_key = 'id_token';
  private username_key = 'username';

  constructor(private http: HttpClient, private appConfigService: AppConfigService) {
    this.url = this.appConfigService.apiBaseUrl;
  }

  // 记录登录之后,需要跳转到原来请求的地址
  redirectUrl: string = "";

  // 登录
  public loggedIn(): boolean {
    return localStorage.getItem(this.token_key) != null;
  }

  // TODO 登出
  logout(router: Router): void {
    localStorage.removeItem(this.username_key);
    localStorage.removeItem(this.token_key);
    router.navigateByUrl('home/login');
  }

  login(user: { username: string, password: string }): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.url}/user/login`, user, { headers: headers, observe: 'response' }) //为了得到整个response
      .pipe(
        tap(response => {
          this.doLoginUser(response.headers.get('token')!, user.username);
        }), //把token存在localStorage
      );
  }

  private doLoginUser(token: string, username: string) {
    localStorage.setItem(this.token_key, token);
    localStorage.setItem(this.username_key, username);
  }

  get username() {
    return localStorage.getItem(this.username_key)!;
  }

  get token() {
    return localStorage.getItem(this.token_key)!;
  }

  register(user: {
    username: string,
    password: string,
    sex: string,
    portraitId: number,
    jacket: number,
    pants: number
  }): Observable<any> {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(`${this.url}/user/register`, user, { headers: headers, observe: 'response' })
      .pipe(
        tap(response => {
          console.log("registerresp:", response)
        }))
  }

  getUsername() {
    return localStorage.getItem(this.username_key);
  }

  getUserProfile(): Observable<any> {
    return this.http.get<any>(`${this.url}/user/profile`)
  }

  getUserBehavior(): Observable<any> {
    return this.http.get<any>(`${this.url}/user/attributes`)
  }

  getHistoryRecord(): Observable<any> {
    return this.http.get<any>(`${this.url}/user/records`)
  }
}
