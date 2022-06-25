import { Component,  OnInit } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-npc-button',
  templateUrl: './npc-button.component.html',
  styleUrls: ['./npc-button.component.css']
})
export class NpcButtonComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    gsap.set("svg", { autoAlpha: 1 });

    gsap
      .timeline({ defaults: { ease: "none", duration: 10 } })
      .from(
        ".text",
        {
          attr: { startOffset: "100%" }
        }
      )
      .to("#circle", {
        rotation: 360,
        transformOrigin: "center center",
        repeat: -1
      });
  }
}
