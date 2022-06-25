import { RoomSelectService } from './../../services/room-select.service';
import { Component, ElementRef, OnInit, QueryList, ViewChildren, AfterViewInit, AfterContentChecked, ViewChild } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RoomInfo } from 'src/app/models/roomInfo';
import { Router, Event as NavigationEvent, NavigationStart } from '@angular/router';
import { AppComponent } from 'src/app/app.component';
import { first, Subject, takeUntil } from 'rxjs';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-room-selector',
  templateUrl: './room-selector.component.html',
  styleUrls: ['./room-selector.component.css']
})
export class RoomSelectorComponent implements OnInit, AfterViewInit {
  /*和动画有关*/
  iteration = 0; //当滑到首尾时开始继续往下滑
  spacing = 0.1; // 卡片的间隔时间
  snapTime!: Function;
  trigger!: any;
  seamlessLoop: any;
  scrub: any;
  /* 密室信息 */
  rooms:RoomInfo[]=[];

  @ViewChildren("card")
  cardRef!: QueryList<ElementRef>; //8个

  @ViewChild('gallery')
  gallery!: ElementRef; //8个

  private readonly _destroyed: Subject<void> = new Subject();

  constructor(private app:AppComponent,private router: Router ,private roomSelectService: RoomSelectService) {
    //从profile回到roomselector,动画完成后调整container位置
    this.app.done$
      .pipe(first(), takeUntil(this._destroyed))
      .subscribe(() => {
        this.gallery.nativeElement.setAttribute('style', 'left:0 ');
        this.trigger.refresh();
      });
  }

  ngOnInit(): void {
    console.log('room selector component oninit')
    this.roomSelectService.getRoomInfo().subscribe(rooms => this.rooms = rooms);
    // this.rooms = rooms
  }

  ngAfterViewInit(): void {
    var that = this;
    this.cardRef.changes.subscribe(cards => {
      that.initAnimation(cards.toArray())
    });
    this.router.events
      .subscribe(
        (event: NavigationEvent) => {
          if (event instanceof NavigationStart) { //点了toolbar中的按钮，要跳到别的页面了
            if (event.url == "/roomSelector") {
              this.trigger.scroll(0);
            } else {
              this.trigger.disable(false);//禁用trigger,false表示定格，不用恢复，防止影响动画
            }
          }
        });
  }

  initAnimation(cards: any) {
    console.log('init animation');
    // gsap.set(cards, { xPercent: 300, opacity: 0, scale: 0 }); //设置初始状态,向左移动宽度的400%
    //一个可以重用的函数，snap的幅度是spacing, 得到和使用时的参数最近的n*spacing, n为整数
    this.snapTime = gsap.utils.snap(this.spacing);

    // 一个timeline
    this.seamlessLoop = this.buildSeamlessLoop(cards, this.spacing, this.animateFunc);

    // a proxy object to simulate the playhead position, but can go infinitely in either direction 
    // and we'll just use an onUpdate to convert it to the corresponding time on the seamlessLoop timeline.
    let playhead = { offset: 0 };

    // feed in any offset (time) and return the corresponding wrapped time (0 - seamlessLoop's duration)
    let wrapTime = gsap.utils.wrap(0, this.seamlessLoop.duration());

    let that = this;

    this.scrub = gsap.to(playhead, { // we reuse this tween to smoothly scrub the playhead on the seamlessLoop
      offset: 0,
      onUpdate() {
        that.seamlessLoop.time(wrapTime(playhead.offset)); //使得seamlessloop的时间在0-duration之间循环
      },
      duration: 0.5,
      ease: "power3",
      paused: true
    });

    this.trigger = ScrollTrigger.create({
      start: 0, //start pos是0px
      onUpdate(self) { //called every time the scroll position changed
        let scroll = self.scroll(); //得到当前滑动位置

        if (scroll > self.end - 1) { //滑到最后3000
          that.wrap(1, 1);
        } else if (scroll < 1 && self.direction < 0) { //滑到最前
          that.wrap(-1, self.end - 1);
        } else {
          that.scrub.vars['offset'] = (that.iteration + self.progress) * that.seamlessLoop.duration();
          // to improve performance, invalidate and restart the same tween. No need for overwrites or creating a new tween on each update.
          that.scrub.invalidate().restart();
        }
      },
      end: "+=3000", // 3000px beyond where the start is
      pin: "app-background-star"
    });

    // when the user stops scrolling, snap to the closest item.
    ScrollTrigger.addEventListener("scrollEnd", () => that.scrollToOffset(this.scrub.vars['offset']));
  }

  progressToScroll(progress: any) { //把progress夹在1和3000之间
    return gsap.utils.clamp(1,
      this.trigger.end - 1,
      gsap.utils.wrap(0, 1, progress) * this.trigger.end); // the value to clamp
  }

  wrap(iterationDelta: any, scrollTo: any) {
    this.iteration += iterationDelta;
    this.trigger.scroll(scrollTo);
    this.trigger.update(); // by default, when we trigger.scroll(), it waits 1 tick to update().
  };

  // moves the scroll playhead to the place that corresponds to the totalTime value of the seamlessLoop, and wraps if necessary.
  // offset can exceed 0 and duration() in either direction
  scrollToOffset(offset: any) {
    let snappedTime = this.snapTime(offset),
      progress = (snappedTime - this.seamlessLoop.duration() * this.iteration) / this.seamlessLoop.duration(),
      scroll = this.progressToScroll(progress);
    if (progress >= 1 || progress < 0) {//0-1之间
      return this.wrap(Math.floor(progress), scroll);
    }
    this.trigger.scroll(scroll); // set the scroll position , That'll call the onUpdate() on the trigger if there's a change.
  }

  // this function will get called for each element in the buildSeamlessLoop() function, 
  // and we just need to return an animation that'll get inserted into a master timeline, spaced
  animateFunc(element: any) {
    const tl = gsap.timeline();
    tl
      .fromTo(element, { scale: 0, opacity: 0 }, //卡牌的大小缩放
        { scale: 1, opacity: 1, zIndex: 100, duration: 0.5, yoyo: true, repeat: 1, ease: "power1.in", immediateRender: false })
      .fromTo(element, { xPercent: 400 },  //卡牌的左右移动
        { xPercent: -400, duration: 1, ease: "none", immediateRender: false }, 0);
    return tl;
  }

  buildSeamlessLoop(items: any, spacing: any, animateFunc: any) {
    let rawSequence = gsap.timeline({ paused: true }), // this is where all the "real" animations live
      seamlessLoop = gsap.timeline({ // this merely scrubs the playhead of the rawSequence so that it appears to seamlessly loop
        paused: true,
        repeat: -1, // to accommodate infinite scrolling/looping
        onReverseComplete() { //called when the animation has reached its beginning again from the reverse direction
          this['totalTime'](this['rawTime']() + this['duration']() * 100); // seamless looping backwards
        }
      }),
      cycleDuration = spacing * items.length, //0.8
      dur: any; // the duration of just one animateFunc() (we'll populate it in the .forEach() below...

    // loop through 3 times so we can have an extra cycle at the start and end - we'll scrub the playhead only on the 2nd cycle
    items.concat(items).concat(items).forEach((item: any, i: any) => {
      let anim = animateFunc(items[i % items.length].nativeElement);
      rawSequence.add(anim, i * spacing);
      dur || (dur = anim.duration());//如果是undefined就会=duration
    });

    // animate the playhead linearly from the start of the 2nd cycle to its end (so we'll have one "extra" cycle at the beginning and end)
    seamlessLoop.fromTo(rawSequence, {
      time: cycleDuration + dur / 2 //0.8+0.5
    }, {
      time: "+=" + cycleDuration,
      duration: cycleDuration,
      ease: "none"
    });
    return seamlessLoop;
  }
}