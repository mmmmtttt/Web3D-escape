import { AppConfigService } from './../../services/app-config.service';
import { ModelThumbnail } from './../figure-card/model-thumbnail.model';
import { Component, OnInit,  forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/*
NG_VALUE_ACCESSOR 提供者用来指定实现了 ControlValueAccessor 接口的类，并且被 Angular 用来和 formControl 同步，
通常是使用控件类或指令来注册。所有表单指令都是使用NG_VALUE_ACCESSOR 标识来注入控件值访问器，然后选择合适的访问器。
 */
export const EXE_COUNTER_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FigureSelectorComponent),
  multi: true
};

/*
选择虚拟形象的面板
*/
@Component({
  selector: 'app-figure-selector',
  templateUrl: './figure-selector.component.html',
  styleUrls: ['./figure-selector.component.css'],
  providers: [EXE_COUNTER_VALUE_ACCESSOR],
})
export class FigureSelectorComponent implements OnInit, ControlValueAccessor {//实现ControlValueAccessor,使得我们的自定义组件可以使用formControl
  public thumbnailList: ModelThumbnail[] = [];
  modelNumber:number; /* 总共模型个数 */
  _modelSelected: number = 0;

  constructor(private appConfigService:AppConfigService) {
    this.modelNumber = appConfigService.modelNum;
    for (let i = 0; i < this.modelNumber; i++) {
      this.thumbnailList.push(new ModelThumbnail(i, false));
    }
  }

  ngOnInit(): void {
  }

  get modelSelected() {
    return this._modelSelected;
  }

  set modelSelected(value: number) { 
    this._modelSelected = value;
    this.propagateOnChange(this._modelSelected); //在此建立了类内的变量modelSelected和外界formCtrl看到的value之间的联系
  }

  /*
  ControlValueAccessor的方法，当合法值输入控件时，我们需要更新控件内的值
   */
  writeValue(value: any): void {
    if (value) {
      this.modelSelected = value;
    }
  }

  propagateOnChange: (value: any) => void = (_: any) => { };
  propagateOnTouched: (value: any) => void = (_: any) => { };

  /*注册 onChange 事件，在初始化时被调用，参数为事件触发函数。 */
  registerOnChange(fn: any) {
    this.propagateOnChange = fn;
  }

  /*注册 onTouched 事件，即用户和控件交互时触发的回调函数。 */
  registerOnTouched(fn: any) {
    this.propagateOnTouched = fn;
  }
}

