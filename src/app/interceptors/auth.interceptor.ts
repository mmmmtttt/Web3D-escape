import { AppConfigService } from './../services/app-config.service';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>,
    next: HttpHandler): Observable<HttpEvent<any>> {
    const idToken = localStorage.getItem("id_token");
    console.log("auth interceptor");

    //azure上的chatbot
    if (req.url.includes('8083')) {
      const cloned = req.clone({
        headers: req.headers.set("Authorization", "EndpointKey afa4375f-0837-4e8f-bae4-c3a4069ca8ff")
      });``
      return next.handle(cloned);
    } else if (idToken) { //存在token，则每次都请求带上token
      const cloned = req.clone({
        headers: req.headers.set("Authorization", "Bearer " + idToken)
      });
      return next.handle(cloned);
    } else {//不存在token,直接发
      return next.handle(req);
    }
  }
}