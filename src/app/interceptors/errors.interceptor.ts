import { AlertifyService } from './../services/alertify.service';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorsInterceptor implements HttpInterceptor {

  constructor(private alertify: AlertifyService) { }

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    console.log("error interceptor");
    return next.handle(request)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const errorMessage = this.setError(error);
          console.log(error.status,errorMessage);
          this.alertify.error(errorMessage);
          return throwError(() => errorMessage);
        })
      );
  }

  setError(error: HttpErrorResponse): string {
    let errorMessage = 'Unknown error occured';
    console.log("errorresp:",error)
    errorMessage = error.error.message;
    return errorMessage;
  }
}
