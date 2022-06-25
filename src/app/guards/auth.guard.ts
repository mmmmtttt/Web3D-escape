import { Injectable } from '@angular/core';
import { CanActivate,ActivatedRouteSnapshot,RouterStateSnapshot,Router, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService} from '../services/auth.service';

@Injectable({
    providedIn:'root',
})
export class AuthGuard implements CanActivate{
    constructor(private router:Router,private authService : AuthService){}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        let url : string = state.url
        return this.checkLogin(url);
    }

    checkLogin(url: string):boolean{
        if(this.authService.loggedIn()){
            return true;
        }

        // 记录原始的请求地址，登陆后跳转到地址
        this.authService.redirectUrl = url;

        // 未登录，跳转到登陆页面
        this.router.navigateByUrl('home/login');
        return false;
    }
}