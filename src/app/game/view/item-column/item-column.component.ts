import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-item-column',
  templateUrl: './item-column.component.html',
  styleUrls: ['./item-column.component.css']
})

export class ItemColumnComponent implements OnInit{

  @Input() items!:number[]
  
  show:boolean = false;
  detail:boolean = false;
  chosed!:number;

  @ViewChild('icon')
  icon!:ElementRef;

  constructor() { }

  ngOnInit(){}

  showItems(){
    this.show = !this.show;
    this.detail = false;
  }

  magnify(item:number){
    this.detail = true;
    this.chosed = item;
  }

  /* 加物体进入时组件闪烁，给父组件调用的方法 */
  shine(){
    this.icon.nativeElement.classList.add('shine');
    window.setTimeout(()=>{
      this.icon.nativeElement.classList.remove('shine');
    },3000)
  }

  canBeAdded(id:number){
    return (id>=0 && id<=4) || id==8 || id==9;
  }
}