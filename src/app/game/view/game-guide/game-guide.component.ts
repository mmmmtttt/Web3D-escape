import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin'

gsap.registerPlugin(TextPlugin)

@Component({
    selector: 'app-game-guide',
    templateUrl: './game-guide.component.html',
    styleUrls: ['./game-guide.component.css']
})

export class GameGuideComponent implements OnInit {
    @Input()
    showGameIntro: boolean = false;

    constructor() { }

    ngOnInit() {
        gsap.to("#text", {
            duration: 5,
            text: { value: "热爱计算机的勇士们啊，欢迎你们来到这个古老的密室！这个浴室由公爵大人的灵魂驻守着，也由他精心布置，你们将在他的带领下寻找线索，解出谜题，找到打开大门的最终密码。相信凭借你们的细心聪慧，一定能在密室中寻得蛛丝马迹，找到关键的物品，通过公爵的考验。" },
            delay: 0,
        });
    }
}