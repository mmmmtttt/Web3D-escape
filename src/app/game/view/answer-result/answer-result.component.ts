import { getPlayerUsername, getCheckpointName } from './../../utils/utils';
import { VictoryData, achievement } from './../../../models/VictoryData';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as confetti from 'canvas-confetti';

interface Contribution{ 
  username : string;
  checkpoint : string;
}

@Component({
  selector: 'app-answer-result',
  templateUrl: './answer-result.component.html',
  styleUrls: ['./answer-result.component.css']
})
export class AnswerResultComponent implements OnInit {

  @ViewChild('c', { static: true })
  canvasRef!: ElementRef;

  confetti!: any;


  /***** @author mengtong 2022-06-16 15:24:41 *********
   最终逃出后显示的战绩总结
  ****************************************************/
  winner: string = ''
  showFinalResult:boolean = false;
  showCheckPointCracked:boolean = false;
  contributes:Contribution[] = []

  constructor() { }

  ngOnInit(): void {
    this.confetti = confetti.create(this.canvasRef.nativeElement, { resize: true })
  }

  successOnCheckPoint() {
    this.showFinalResult = false;
    this.showCheckPointCracked = true;
    this.playConfetti()
    window.setTimeout(() => {
      this.canvasRef.nativeElement.style.display = 'none';
      this.showCheckPointCracked = false;
    }, 3000)
  }

  successOnEscape(data: VictoryData,usernameMap:any) {
    this.showCheckPointCracked = false;
    this.showFinalResult = true;
    this.playConfetti()
    this.winner = this.getName(data.winnerId,usernameMap)
    data.achievement.forEach(element => {
      let contribution = {
        username: this.getName(element.socketId,usernameMap),
        checkpoint: getCheckpointName(element.checkpoint)
      }
      this.contributes.push(contribution)
    });
  }

  playConfetti(){
    if (this.canvasRef.nativeElement.style.display != 'block') {
      this.canvasRef.nativeElement.style.display = 'block';
    }
    this.confetti()
  }

  /**
   * 之所以要再包装一层，是因为怕有人用户名就叫You
   */
  getName(id:number,map:any){
    let name = getPlayerUsername(id,map);
    if(name==''){
      name = 'You'
    }
    return name
  }
}
