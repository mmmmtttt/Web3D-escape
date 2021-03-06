import { World } from './../../model/World';
import { NPC_INSTRUCT, NPC_NO_SPECIFIC, NPC_HIDE } from './npcCheckpointId';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from "three";
import { dialogues, riddles, tips, chat } from 'src/app/models/npc-dialogue/room1';
import { gsap } from 'gsap';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { GameSyncService } from './../../../services/game-sync.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AppConfigService } from 'src/app/services/app-config.service';
import { WebsocketService } from 'src/app/services/websocket.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-game-npc',
  templateUrl: './game-npc.component.html',
  styleUrls: ['./game-npc.component.css']
})

export class GameNPCComponent implements OnChanges, OnInit {

  private loader = new FBXLoader();
  npcModel!: THREE.Group;
  private modelPath = "../../../assets/npc_3d_model/npc.fbx"
  private animation: any;
  private appear_time: number = 2000;
  private disappear_time: number = 4000;

  @Output() npcFinish = new EventEmitter();
  @Input() checkPoint_id!: number | undefined;
  @Input() solved!: boolean;
  @Input() world!: World;

  content: string = "";
  showNext: boolean = true;
  showPre: boolean = false;
  showClose: boolean = false;
  showIntro: boolean = false;
  showMenu: boolean = false;
  showChat: boolean = false;
  showTips: boolean = false;
  showQuestion: boolean = false;
  showInput: boolean = true;

  private index: number = 0;

  answerFormControl = new FormControl('', [Validators.required]);

  matcher = new MyErrorStateMatcher();

  /* ?????? */
  audio!: THREE.Audio;

  constructor(private webSocketService: WebsocketService, private gameSyncService: GameSyncService, private http: HttpClient, private appConfigService: AppConfigService) { }

  ngOnInit(): void {
    console.log('GameNPC component oninit')
    if (!this.webSocketService.socket) {
      //TODO: ?????????roomId?????????
      this.webSocketService.connect(1)
    }

    // ???????????? AudioListener ?????????????????? camera ???
    const listener = new THREE.AudioListener();
    this.world.camera.add(listener);

    // ?????????????????? audio ???
    const sound = new THREE.Audio(listener);

    // ???????????? sound ?????????????????? Audio ??????????????????
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('../../../../assets/bgm/npc.m4a', function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.5);
    });
    this.audio = sound
  }

  /**
   * game-scene???????????????checkpointId??????????????????????????????
   * @param changes 
   */
  ngOnChanges(changes: SimpleChanges): void {
    const idChange = changes['checkPoint_id']
    console.log('ck',idChange)
    //1. ????????????room model????????????????????????npc model??????npc??????
    if (idChange && idChange.previousValue != idChange.currentValue
      && idChange.currentValue == NPC_INSTRUCT) {
      this.content = dialogues[0];
      this.setUpScene()
    }
    //2. ???gamescene???????????????????????????floatmode??????fullViewMOde,checkpointid->NPC_HIDW
    else if (idChange && idChange.previousValue != idChange.currentValue && idChange.currentValue == NPC_HIDE) {
      this.closeImmediately()
    }
    //3. ????????????checkpoint??????,??????floatMode,NPC_NO_SPECIFIC???checkpointid
    else if (idChange && idChange.previousValue != idChange.currentValue) {
      this.onClickNPCButton()
    }
  }

  /**
   * ??????npc button???npc??????
   */
  onClickNPCButton() {
    this.npcModel.visible = true
    // ????????????input?????? ????????????change, ??????????????????
    this.adjustContentByShowFlags()
    this.npcAppearThenTalk(this)
  }

  /**
   * ??????showFlags?????????????????????
   */
  adjustContentByShowFlags() {
    this.index = 0;
    if (this.checkPoint_id == NPC_NO_SPECIFIC) {
      this.setContentInFullMode();
    }// ???????????????checkpointid
    else {
      if (this.showTips) {
        this.content = tips[this.checkPoint_id][0];
        if (tips[this.checkPoint_id].length == 1) {
          this.showNext = false;
          this.showClose = true;
        }
      } else if (this.showQuestion) {
        if (!this.solved) {
          this.content = riddles[this.checkPoint_id];
          this.showInput = true;
        } else {
          this.content = "??????????????????~";
          this.showInput = false;
        }
      }
    }
  }

  /**
   * ???fullViewMode?????????showFlags?????????????????????
   */
  private setContentInFullMode() {
    if (this.showQuestion) {
      this.content = '???????????????????????????~?????????????????????';
      this.showInput = false;
    } else if (this.showTips) {
      const random = Math.round(Math.random() * (tips.length - 1));
      const a = Math.round(Math.random() * (tips[random].length - 1));
      this.content = tips[random][a];
      this.showNext = false;
    }
  }


  private setUpScene() {
    // ????????????
    gsap.set(this.world.mainSceneLight, {
      intensity: 0.1
    })
    this.loadNPCModel()
  }

  /**
   * ???world???detailScene?????????npc model
   */
  private loadNPCModel() {
    //load the model
    let component: GameNPCComponent = this;

    this.loader.load(
      component.modelPath,
      (object) => {
        component.npcModel = object;
        component.animation = object.animations;
        component.npcModel.scale.set(0.04, 0.04, 0.04);
        component.npcModel.visible = true;

        component.world.detailCamera.add(component.npcModel);
        component.npcModel.position.set(4, -2.5, -10);
        component.npcModel.rotateY(-0.45);

        component.world.npcMixer = new THREE.AnimationMixer(component.npcModel);
        component.npcAppearThenTalk(component);
      },
      (xhr) => {
        // called while loading is progressing
        console.log("loading npc model");
      },
      (error) => {
        console.error(error);
      }
    );
  }

  /**
   * npc ????????????
   * ?????????????????????
   */
  npcAppearThenTalk(component: GameNPCComponent) {
    //????????????
    if (this.checkPoint_id != NPC_INSTRUCT && this.npcModel.position.x != 7.5) {
      this.npcModel.scale.set(0.01, 0.01, 0.01)
      this.npcModel.position.set(7.5, -1, -10)
      this.npcModel.rotateY(-0.25)
    }
    // ??????????????????
    component.world.npcMixer.stopAllAction()
    let appearAnim = THREE.AnimationClip.findByName(component.animation, 'ArmatureAction.001_GLTF_created_0.002');
    let appear = component.world.npcMixer.clipAction(appearAnim);
    appear.clampWhenFinished = true;
    appear.setLoop(THREE.LoopOnce, 1);
    appear.play();

    //???????????????????????????????????????
    let talkAnim = THREE.AnimationClip.findByName(component.animation, 'ArmatureAction.001_GLTF_created_0.003');
    let talk = component.world.npcMixer.clipAction(talkAnim);
    window.setTimeout(() => { //????????????????????????npc???????????????
      if (this.checkPoint_id == NPC_INSTRUCT) {
        this.showIntro = true;
      } else if(!this.showQuestion&&!this.showTips&&!this.showChat){
        this.showMenu = true;
      }
      component.world.npcMixer.stopAllAction();
      talk.play();
    }, component.appear_time);
  }

  /**
   * ??????npc????????????
   */
  toggleSound() {
    // ?????????
    if (this.audio.isPlaying) {
      gsap.to(this.audio.listener.gain.gain,{
        duration: 1,
        value:0,
        onComplete: ()=>{
          this.audio.pause()
        }
      })
    }else{
      this.audio.play()
      gsap.to(this.audio.listener.gain.gain,{
        duration: 1,
        value:0.5
      })
    }
  }

  nextLine() {
    this.index += 1;
    console.log("index", this.index)
    if (this.checkPoint_id == NPC_INSTRUCT) {
      this.content = dialogues[this.index];
      if (this.index === dialogues.length - 1) {
        this.showNext = false;
        this.showClose = true;
      }
    } else if (this.showTips) {
      this.content = tips[this.checkPoint_id!][this.index];
      if (this.index === tips[this.checkPoint_id!].length - 1) {
        this.showNext = false;
      }
    }
    this.showPre = true;
  }

  preLine() {
    this.index -= 1;
    this.content = tips[this.checkPoint_id!][this.index];
    if (this.index == 0) {
      this.showPre = false;
    }
    this.showNext = true;
  }

  close() {
    let component: GameNPCComponent = this;
    component.world.npcMixer.stopAllAction()
    let disappearAnim = THREE.AnimationClip.findByName(this.animation, 'ArmatureAction.001_GLTF_created_0.001');
    console.log('find:', disappearAnim)
    let disappear = component.world.npcMixer.clipAction(disappearAnim);
    disappear.clampWhenFinished = true;
    disappear.setLoop(THREE.LoopOnce, 1);
    disappear.play();
    if(this.audio && this.audio.isPlaying){
      gsap.to(this.audio.listener.gain.gain,{
        duration: 1,
        value:0,
        onComplete: ()=>{
          this.audio.stop()
        }
      })
      //TODO: remove audio listener from camera?
    }

    // ???????????????
    window.setTimeout(() => {
      //??????????????????????????????
      gsap.to(this.world.mainSceneLight, { duration: 2, intensity: 0.3 })
      gsap.to('.dialog', { duration: 2, opacity: 0 })
      component.resetShowFlags() // ???????????????????????????
      this.npcModel.visible = false
    }, 3000);

    //???????????????????????????chat???
    window.setTimeout(() => {
      component.npcFinish.emit(true)
      // ?????????????????????????????????????????????????????????????????????????????????
      if (component.checkPoint_id == NPC_INSTRUCT) {
        component.checkPoint_id = NPC_NO_SPECIFIC
      }
    }, this.disappear_time)
  }

  closeImmediately(){
    let component: GameNPCComponent = this;
    component.world.npcMixer.stopAllAction()
    this.npcModel.visible = false
    gsap.to('.dialog', { duration: 1, opacity: 0 })
    component.resetShowFlags() // ???????????????????????????
  }

  /**
   * ???????????????blahblah???flag????????????????????????
   */
  resetShowFlags() {
    this.showNext = true;
    this.showPre = false;
    this.showClose = false;
    this.showIntro = false;
    this.showMenu = false;
    this.showChat = false;
    this.showTips = false;
    this.showQuestion = false;
    this.showInput = true;
    this.checkPoint_id = undefined;
  }

  back() {
    this.showQuestion = false;
    this.showChat = false;
    this.showTips = false;
    this.showMenu = true;
  }

  riddles() {
    this.showMenu = false;
    this.showTips = false;
    this.showChat = false;
    this.showQuestion = true;
    this.adjustContentByShowFlags();
  }

  tips() {
    this.showMenu = false;
    this.showQuestion = false;
    this.showChat = false;
    this.showTips = true;
    this.adjustContentByShowFlags();
  }

  chat() {
    this.showMenu = false;
    this.showChat = true;
    this.content = "??????????????????????????????????????????"
  }

  onSubmit() {
    var data = {
      checkpoint: this.checkPoint_id,
      answer: this.answerFormControl.value
    }
    this.gameSyncService.emit('try_answer', data);
    this.answerFormControl.setValue("")
  }

  /**
   * ??????
   */
  getResponse() {
    const message = this.answerFormControl.value;
    if (message.trim() == "") {
      this.content = "?????????????????????????????????????????????????????????????????????";
    } else {
      // var random = Math.round(Math.random() * (chat.length - 1));
      // this.content = chat[random];

      // ??????azure???????????????????????????
      let headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      let that = this;
      this.http.post<any>(this.appConfigService.apiBotUrl, { question: message }, { headers: headers, observe: 'response' })
        .subscribe((response: any) => {
          if (response) {
            that.content = response.body.answers[0].answer
          }
        })
    }
    this.answerFormControl.setValue(" ");
  }
}