import { LoginComponent } from './../login/login.component';
import { RegisterComponent } from './../register/register.component';
import { Component, OnInit, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ImgLoadedDirective } from './image.directive';
import { forkJoin, scan } from 'rxjs';
import { Router, Event as NavigationEvent, NavigationStart } from '@angular/router';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

  inRegister: boolean = true;// 标记当前再登录还是注册，用来调整表单位置（注册要稍微往上移一点）
  loading: boolean = true; //图标全部加载完后取消loading

  @ViewChildren(ImgLoadedDirective) images!: QueryList<ImgLoadedDirective>;

  constructor(private router:Router) { 
    this.router.events
      .subscribe(
        (event: NavigationEvent) => {
          if (event instanceof NavigationStart) { //点了toolbar中的按钮，要跳到别的页面了
            console.log('router event in login:',event)
            if (event.url == "/roomSelector") { //到roomselector，把自己的动画清空
              console.log('to roomselector in home')
              ScrollTrigger.getById('homeScrollTrigger')?.kill()
            }
          }
        });
  }

  /* 全部资源加载完毕，不再显示loading */
  ngAfterViewInit(): void {
    forkJoin(this.images.map(imgDir => imgDir.loaded)).subscribe(() => {
      console.log('all images loaded')
      this.loading = false;
    })
  }

  ngOnInit(): void {
    this.initAnimate();
  }

  initAnimate() {
    // gsap.set('.main', { position: 'fixed', background: '#000', width: '100%', height: '100%', top: 0, left: '50%', x: '-50%' })
    // gsap.set('.scrollDist', { width: '100%', height: '120%' })
    console.log('init anim')
    gsap.timeline({
      id: 'hometl',
      scrollTrigger: {
        id: 'homeScrollTrigger',
        trigger: '.scrollDist',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        pin: 'section',
        // markers:true
      }
    }).fromTo('.scroll-icon', { opacity: 0.5 }, { opacity: 0 }, 0)
      .fromTo('.cliffLeft', { x: 0, y: 0 }, { x: -200, y: 70 }, 0)
      .fromTo('.cliffRight', { x: 0, y: 0 }, { x: 200, y: -80 }, 0)
      .fromTo('.man', { y: 253 }, { y: 0 }, 0)
      .fromTo('h2', { opacity: 0 }, { opacity: 1 }, 0)
  }

  onActivate(e: any) {
    console.log('onActivate in home',e)
    //跳到roomselector的时候inLogin还是true
    if (e instanceof RegisterComponent) { //从login进入register时，注册表单往上移一点
      console.log('onActivate in home: to RegisterComponent')
      this.inRegister = true;
      gsap.set('.panel', {
        delay: -0.1,
        y: -100
      })
    } else if (this.inRegister && e instanceof LoginComponent) { //从register返回login，登陆表单恢复再中间
      console.log('onActivate in home: to login')
      this.inRegister = false;
      gsap.set('.panel', {
        delay: -0.1,
        y: 0
      })
    }
  }
}
