import { ModelThumbnail } from './model-thumbnail.model';
import { Component, OnInit, Input, ViewChild, ElementRef, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-figure-card',
  templateUrl: './figure-card.component.html',
  styleUrls: ['./figure-card.component.css']
})
export class FigureCardComponent implements OnInit {

  @ViewChild("radio")
  public radioButtonRef!:ElementRef;

  @Output() selectedModel = new EventEmitter<any>(); //向父组件传值，哪个形象的卡片被选中

  @Input()
  data!: ModelThumbnail;

  constructor() {
   }

  ngOnInit(): void {
  }

  toggleChecked(){
    const radioElement = (<HTMLInputElement>this.radioButtonRef.nativeElement);
    radioElement.checked=!(radioElement.checked);
    this.data.selected = radioElement.checked;
    this.selectedModel.emit(this.data.idx);
  }

}
