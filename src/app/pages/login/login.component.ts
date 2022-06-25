import { AlertifyService } from './../../services/alertify.service';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Validators, FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {
  matcher = new MyErrorStateMatcher();
  hide = true;

  usernameFormControl = new FormControl('', [Validators.required]);
  pwdFormControl = new FormControl('', [Validators.required]);

  constructor( private router: Router, private authService: AuthService, private alertify: AlertifyService) {
  }

  onSubmit(): void {
    this.authService.login({ username: this.username, password: this.password })
      .subscribe((response: Response) => { //成功跳转，不成功被interceptor拦截
        if (response) {
          console.log('login response:',response)
          this.alertify.success("Successfully Login");
          this.router.navigate(['roomSelector']);
        }
      })
  }

  get username():string{
    return this.usernameFormControl.value;
  }

  get password():string{
    return this.pwdFormControl.value;
  }

  toRegister() {
    this.router.navigateByUrl('register');
  }

  ngOnInit(): void {
    console.log("login on init");
  }
}

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}
