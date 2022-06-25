import { AlertifyService } from './alertify.service';
import { VictoryData } from './../models/VictoryData';
import { GameSceneComponent } from './../game/view/game-scene/game-scene.component';
import { Position } from './../models/position';
import { NewUserData } from '../models/newUserData';
import { WebsocketService } from 'src/app/services/websocket.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DelUserData } from '../models/delUserData';
import { AnswerResult } from '../models/answerResult';
import { CheckpointState } from '../models/checkpointState';
import { Action, loadPlayerModel } from '../game/model/Player';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { getCheckpointName, getPlayerUsername } from '../game/utils/utils';

/*游戏状态共享服务*/
@Injectable({
  providedIn: 'root'
})
export class GameSyncService {
  sceneComponent!: GameSceneComponent;

  constructor(private webSocketService: WebsocketService, private alertify: AlertifyService) {
  }

  /***** @author mengtong 2022-05-19 12:46:25 *********
 监听事件，分配处理器
****************************************************/
  dispatchEvents(sceneComponent: GameSceneComponent) {
    this.sceneComponent = sceneComponent
    this.listenNewUser().subscribe(this.onNewUser)
    this.listenDelUser().subscribe(this.onDelUser)
    this.listenPosition().subscribe(this.onPosition)
    this.listenCheckpointState().subscribe(this.onCheckpointState)
    this.listenAnswerResult().subscribe(this.onAnswerResult)
    this.listenVictory().subscribe(this.onVictory);
  }

  emit(eventName: string, data: any) {
    this.webSocketService.socket.emit(eventName, data);
  }

  private listenVictory() {
    return new Observable<VictoryData>((subscriber) => { //当 Observable 初始订阅的时候会调用该方法
      this.webSocketService.socket.on('victory', (data: any) => {
        console.log("victory")
        if (data != undefined) {
          console.log("victory data", data)
          subscriber.next(JSON.parse(data)); //新的值产生，通知subscriber
        }
      });
    });
  }

  private listenNewUser() {
    return new Observable<NewUserData[]>((subscriber) => { //当 Observable 初始订阅的时候会调用该方法
      this.webSocketService.socket.on('new_user', (data: any) => {
        console.log("new_user")
        if (data != undefined) {
          console.log("newuser data", data)
          subscriber.next(JSON.parse(data)); //新的值产生，通知subscriber
        }
      });
    });
  }

  private listenDelUser() {
    return new Observable<DelUserData>((subscriber) => { //当 Observable 初始订阅的时候会调用该方法
      this.webSocketService.socket.on('del_user', (data: any) => {
        if (data != undefined) {
          console.log("deluser data", data)
          subscriber.next(JSON.parse(data)); //新的值产生，通知subscriber
        }
      });
    });
  }

  private listenPosition() {
    return new Observable<Position[]>((subscriber) => { //当 Observable 初始订阅的时候会调用该方法
      this.webSocketService.socket.on('position', (data: any) => {
        if (data != undefined) {
          // console.log("position data",data)
          subscriber.next(JSON.parse(data)); //新的值产生，通知subscriber
        }
      });
    });
  }

  private listenAnswerResult() {
    return new Observable<AnswerResult>((Subscriber) => {
      this.webSocketService.socket.on('answer_result', (data: any) => {
        if (data != undefined) {
          console.log("tryanswer data", data)
          Subscriber.next(JSON.parse(data));
        }
      })
    })
  }

  private listenCheckpointState() {
    return new Observable<CheckpointState[]>((Subscriber) => {
      this.webSocketService.socket.on('checkpoint_state', (data: any) => {
        if (data != undefined) {
          console.log("checkpointState data", data)
          Subscriber.next(JSON.parse(data));
        }
      })
    })

  }


  /***** @author mengtong 2022-06-03 13:08:26 *********
   事件处理器
  ****************************************************/

  /* 新玩家加入，游戏中需要加载新模型，保存数据 */
  onNewUser = (data: NewUserData[]) => {
    console.log('onNewUser', data)
    if (data.length == 0) { return }
    for (let i = 0; i < data.length; i++) {
      // TODO: 也发了玩家自己的信息，要去掉
      loadPlayerModel(this.sceneComponent.world, data[i])
    }
  }

  /* 有玩家退出，游戏中需要删除模型，删除数据 */
  onDelUser = (data: DelUserData) => {
    console.log("onDelUser", data)
    //清除数据
    const player:THREE.Group = this.sceneComponent.world.playerMap.get(data.socketId)!
    this.sceneComponent.world.playerMap.delete(data.socketId)

    //清除缓存
    this.sceneComponent.clearGroup(player)
    //清除已经加载的模型
    this.sceneComponent.world.scene.remove(player)

    //清除用户名标签
    this.sceneComponent.world.usernameLabelMap.get(data.socketId).remove() //从dom中删除标签
    this.sceneComponent.world.usernameLabelMap.delete(data.socketId)
  }

  /* 已经加入的玩家同步位置信息 */
  onPosition = (data: any[]) => {
    let newPosition;
    for (let i = 0; i < data.length; i++) {
      newPosition = data[i]
      const player = this.sceneComponent.world.playerMap.get(newPosition.socketId!)
      // console.log('onPosition', newPosition)

      //如果player是玩家自己，那么就是undefined，不进行下面的操作
      if (player != undefined) {

        // 正在走路的时候，看向自己走向的终点位置
        if (newPosition.action == Action.walking) {
          let newCoordinate = new THREE.Vector3()
          newCoordinate.set(newPosition.x, 0, newPosition.z)
          // player.lookAt(coordinate) //转向太快，换成柔和的转向

          /* 设置柔和的转向的角度,在render loop中插值来转向 */
          const matrix = new THREE.Matrix4();
          matrix.lookAt(player.position, newCoordinate, this.sceneComponent.upVector3)
          const quaternion = new THREE.Quaternion();
          quaternion.setFromRotationMatrix(matrix);
          this.sceneComponent.playerQuaternion[newPosition.socketId] = quaternion
        }
        // else {//空闲的时候，和玩家的相机位置看向的位置一样
        //   if (newPosition.rotation._y) {
        //     player.rotation.y = Math.PI +newPosition.rotation._y
        //   }
        // }
        gsap.to(player.position, {
          duration: 0.5,
          x: newPosition.x,
          y: 0,
          z: newPosition.z
        })
        // player.position.set(newPosition.x, 0, newPosition.z)

        // 如果是第一次收到别的玩家的position，那么newuser时加载的模型还是不可见，设置成可见
        if (!player.visible) {
          player.visible = true;
          // TODO: 用户名可见性调整
          // this.sceneComponent.world.usernameLabel.get(position.socketId!).element.style.opacity = '0.8'
        }

        //播放动画
        const mixer = this.sceneComponent.world.playerAnimationMap.get(newPosition.socketId!)!;

        const animationClip = THREE.AnimationClip.findByName(player.animations, newPosition.action);
        const clipAction = mixer.clipAction(animationClip, player) //如果已经有，那么就返回已经存在的那个实例

        //如果动画已经在播放，就继续播放(只有动画变化才切换动画状态）
        if (!clipAction.isRunning()) {
          mixer.stopAllAction()
          clipAction.weight = 1; //degree of influence of this.sceneComponent action
          clipAction.fadeIn(0.5); //Increases the weight of this.sceneComponent action gradually from 0 to 1, within the passed time interval. 
          clipAction.play()
        }
      }
    }
  }

  /**
   * 当前密室有一人解开门锁
   * 
   * 清空已输入的密码
   * 把相机移动到装下门
   * 播放门开的动画
   * 显示胜利的最终页面
   */
  onVictory = (data: VictoryData) => {
    this.sceneComponent.clearKeyInput();

    // backtofullview按钮消失
    this.sceneComponent.backToFullView()
    // 移动相机
    const door: THREE.Object3D = this.sceneComponent.world.scene.getObjectByName('Door')!
    this.sceneComponent.world.control.setLookAt(80, 150, -200, 0, 150, 0)
    this.sceneComponent.playAnimationOnce(door)

    // TODO:显示胜利的最终页面
    this.sceneComponent.resultComponent.successOnEscape(data, this.sceneComponent.world.usernameLabelMap)
  }

  /**
   * 在玩家进入游戏时询问线索的状态
   * 将已经解开的线索显示为解开的状态
   */
  onCheckpointState = (data: CheckpointState[]) => {
    // 更新scenecomponent里的数组
    data.forEach((state: CheckpointState) => {
      let solved = state.state == 1
      this.sceneComponent.checkpointState[state.checkpointId] = solved
      if (solved 
        && this.sceneComponent.itemCollection.canBeAdded(state.checkpointId)
        && !this.sceneComponent.itemCheckpoints.includes(state.checkpointId)) {
        this.sceneComponent.itemCheckpoints.push(state.checkpointId)
      }
    })
  }

  /*
  得到玩家尝试答题的正确与否
  显示 某玩家 正确或错误 
  正确的话将线索显示为解开的状态
   */
  onAnswerResult = (data: AnswerResult) => {
    console.log(data)
    //有人答对了
    if (data.result == "true") {
      //TODO:显示页面
      const username = getPlayerUsername(data.socketId, this.sceneComponent.world.usernameLabelMap)

      // 自己答对了
      if (username == '') {
        this.sceneComponent.resultComponent.successOnCheckPoint()
      }
      // 别人答对了
      else {
        this.alertify.success(`WOW! Player ${username} cracks '${getCheckpointName(data.checkpoint)}'`, 3)
      }

      //修改线索状态
      this.sceneComponent.checkpointState[data.checkpoint] = true
      //如果是关键线索，加入物品栏
      if (data.checkpoint >= 0 && data.checkpoint <= 4 
        && !this.sceneComponent.itemCheckpoints.includes(data.checkpoint)) {
        this.sceneComponent.itemCheckpoints.push(data.checkpoint)
      }
    }
    //自己答错了
    else if(data.result == "false"){
      //TODO:提示回答错
      this.alertify.error(`Oops..Keep on trying...`)
    }
    //已经被解开
    else{
      this.alertify.warning('This checkpoint has been cracked')
    }
  }
}
