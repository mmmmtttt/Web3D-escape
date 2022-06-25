import { animate, animateChild, group, query, style, transition, trigger } from '@angular/animations';

export const AnimationRoute =
  trigger('routeAnimations', [
    transition('isRight => isLeft', [
      //style({ position: 'relative' }), //host view relative，child view用absolute来相对host view
      query(':enter, :leave', [ //找出当前宿主组件中的的新旧页面视图
        style({
          position: 'fixed',
          left:0,
          top:0,
          width: '100%'
        })
      ], { optional: true }),
      group([ //并行运行内部动画。
        query(':enter', [
          style({ transform: 'translateX(-100%)' }),
          animate('900ms ease-out', style({ transform: 'translateX(0%)' }))
        ], { optional: true }),
        query(':leave', [
          style({ transform: 'translateX(0%)' }),
          animate('900ms ease-out', style({ transform: 'translateX(100%)' })) 
        ], { optional: true }),
      ]),
    ]),

    transition('isLeft => isRight', [
      query(':enter, :leave', [
        style({
          position: 'fixed',
          width: '100%'
        })
      ], { optional: true }),
      group([
        query(':leave', [
          style({ transform: 'translateX(0%)' }),
          animate('900ms ease-out', style({ transform: 'translateX(-100%)' }))
        ], { optional: true }),
        query(':enter', [
          style({ transform: 'translateX(100%)' }),
          animate('900ms ease-out', style({ transform: 'translateX(0%)' }))
        ], { optional: true })
      ]),
      query(':enter', animateChild()),
    ]),

    transition('isLeft => isDark', [
      query(':leave', [
        style({
          opacity:1,
        }),
        animate('0.5s', style({ opacity: 0 }))
      ], { optional: true }),
      query(':enter', animateChild()),
    ]),
    ])