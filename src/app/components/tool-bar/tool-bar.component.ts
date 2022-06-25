import { AuthService } from './../../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tool-bar',
  templateUrl: './tool-bar.component.html',
  styleUrls: ['./tool-bar.component.css'],
})
export class ToolBarComponent implements OnInit {

  constructor(public authService:AuthService,private router:Router) { }

  ngOnInit(): void {
  }

  logout(){
    this.authService.logout(this.router)
  }

}
