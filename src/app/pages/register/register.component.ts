import { AlertifyService } from './../../services/alertify.service';
import { AuthService } from './../../services/auth.service';
import { AppConfigService } from './../../services/app-config.service';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators, FormBuilder, FormGroup, AbstractControl, ValidatorFn } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  //whether password is hide or not
  hidePwd = true;
  hideConfirmPwd = true;
  matcher = new MyErrorStateMatcher();
  formGroup: FormGroup;
  modelNum: number;// 模型总数,控制figure-show控件的个数
  chooseFigure: boolean = false; //开始注册第二步 标志着动画的转变

  constructor(private _formBuilder: FormBuilder, private router: Router,
    private appConfigService: AppConfigService, private authService: AuthService, private alertify: AlertifyService) {
    this.modelNum = this.appConfigService.modelNum;
    const passwordRegex = /^(?=.*[0-9].*)(?=.*[A-Z].*)(?=.*[a-z].*).{8,}$/;

    this.formGroup = this._formBuilder.group({
      formArray: this._formBuilder.array([
        this._formBuilder.group({
          usernameFormCtrl: ['', Validators.required],
          passwordFormCtrl: ['', Validators.compose([
            Validators.required,
            Validators.pattern(passwordRegex)])],
          confirmPwdFormCtrl: ['', CustomValidator.repeat('passwordFormCtrl')],
          genderFormCtrl: ['', Validators.required]
        }),
        this._formBuilder.group({
          figureFormCtrl: ['', Validators.required]
        }),
      ])
    });
  }

  onSubmit(): void {
    console.log('gender');
    console.log(this.gender);
    this.authService.register({
      username: this.username, 
      sex: this.gender, 
      password: this.password, 
      portraitId: this.portraitId, 
      jacket: 1,
      pants: 1
    })
      .subscribe(() => {
        console.log('in subs')
        this.alertify.success('successfully registered');
        this.router.navigate([''])
      });
  }

  get gender(): string {
    return this.formArray.get([0])!.get('genderFormCtrl')!.value;
  }

  get username(): string {
    return this.formArray.get([0])!.get('usernameFormCtrl')!.value;
  }

  get password(): string {
    return this.formArray.get([0])!.get('passwordFormCtrl')!.value;
  }

  /*暂时如此，以后增加了换装再搞*/
  get portraitId() {
    return this.formArray.get([1])!.get('figureFormCtrl')!.value;
  }

  ngOnInit(): void {
    console.log('register component oninit')
  }

  /** Returns a FormArray with the name 'formArray'. */
  get formArray(): AbstractControl {
    return (this.formGroup.get('formArray')!);
  }
}

/**
 * Error when invalid control is dirty (A control is dirty if the user has changed the value in the UI.)
 * , touched,
 *  or submitted.
 * 
 * 检查单个form的field时显示matError的前提，errorstate时输入框会变红；
 * 之后匹配matError的ngIf条件是否满足决定是否输出提示
 */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && !control.untouched && (control.dirty || control.touched || isSubmitted));
  }
}

/*自定义validator判断是否两次密码一致 */
export class CustomValidator {
  static repeat(controlName: string): ValidatorFn {
    let otherControl: AbstractControl;
    return (control: AbstractControl): any => {
      if (!control.parent) {
        return null;
      }

      if (!otherControl) { //第一次是空，然后赋值；之后直接可以取
        otherControl = (control.parent.get(controlName)!); //!非空断言
        otherControl.valueChanges.subscribe(p => control.updateValueAndValidity());//兩邊都輸入完而且驗證也過了，但去改了password
      }

      return otherControl.value !== control.value ? { 'match': true } : null;
    };
  }
}
