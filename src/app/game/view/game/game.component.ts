import { WebsocketService } from 'src/app/services/websocket.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  public roomId!: number;    
  showGuide:boolean=false; //展示鼠标操作说明

  constructor(private route: ActivatedRoute,private webSocketService:WebsocketService,private router:Router) { }

  ngOnInit(): void {
    let that = this;
    this.route.params.subscribe({
      next:(val) => {
        that.roomId = val['id'];
      }
    });
  }
}
