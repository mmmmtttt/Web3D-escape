import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { AnimationRoute } from '../../src/app/route-animation';
import { AnimationEvent } from "@angular/animations";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations:[AnimationRoute]
})
export class AppComponent {
  title = 'escape';
  gameIntroduction = '热爱计算机的勇士们啊，欢迎你们来到这个古老的密室! 这个浴室由公爵大人的灵魂驻守着，也由他精心布置，你们将在他的带领下寻找线索，解出谜题，找到打开大门的最终密码。 相信凭借你们的细心聪慧，一定能在密室中寻得蛛丝马迹，找到关键的物品，通过公爵的考验! '

  // router animation的开始和结束事件
  public start$: Subject<AnimationEvent> = new Subject();
  public done$: Subject<AnimationEvent> = new Subject();

  prepareRoute(outlet:RouterOutlet){
    //prepareRoute() 方法会获取这个 outlet 指令的值（通过 #outlet="outlet"），
    // 并根据当前活动路由的自定义数据返回一个表示动画状态的字符串值。可以用这个数据来控制各个路由之间该执行哪个转场。
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}
