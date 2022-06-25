import { Directive, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';

/* 为了判断主页的图片是否加载完成 */
@Directive({
  selector: 'img',
})
export class ImgLoadedDirective {
  @Output() loaded = new EventEmitter();

  @HostListener('load')
  @HostListener('error')
  imageLoaded() {
    this.loaded.emit();
    this.loaded.complete();
  }
} 
