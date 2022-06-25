import { NavigationStart, Router, Event as NavigationEvent} from '@angular/router';
import { RoomInfo } from '../../models/roomInfo';
import { Component, Input, OnInit } from '@angular/core';
import { NgxUiLoaderService } from "ngx-ui-loader";

@Component({
  selector: 'app-room-card',
  templateUrl: './room-card.component.html',
  styleUrls: ['./room-card.component.css']
})
export class RoomCardComponent implements OnInit {

  @Input()
  room!: RoomInfo;

  constructor( private loaderService: NgxUiLoaderService, 
    private router: Router) { }

  ngOnInit(): void {
    this.router.events.subscribe((event: NavigationEvent) => {
      if (event instanceof NavigationStart && event.url.includes("game")) {
        this.loaderService.startLoader('gameloader');
      }
    })
  }
}
