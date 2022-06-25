import { animate } from '@angular/animations';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-video-homepage',
  templateUrl: './video-homepage.component.html',
  styleUrls: ['./video-homepage.component.css']
})
export class VideoHomepageComponent implements OnInit {

  @ViewChild('title', { static: true })
  title!: ElementRef<HTMLHeadingElement>;

  constructor(private router: Router) { }

  ngOnInit(): void {
    // this.animate()
  }

  animate() {
    gsap.to("#bg", {
      duration: 5,
      scale: 0.3,
      x: -300,
      scrollTrigger: {
        trigger: ".login",
        toggleActions: "restart pause reverse resume"
      }
    });
    gsap.to(".title", {
      duration: 5,
      scale: 3,
      // markers: true,
      x: -100,
      scrollTrigger: {
        trigger: ".login",
        toggleActions: "restart pause reverse resume"
      }
    });

  }


  toLogin() {
    this.router.navigateByUrl('login');
  }

  toRegister() {
    this.router.navigateByUrl('register');
  }

}
