import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AnswerResultComponent } from './../answer-result/answer-result.component';
import { ItemColumnComponent } from './../item-column/item-column.component';
import { NPC_NO_SPECIFIC, NPC_HIDE } from './../game-npc/npcCheckpointId';
import { Position } from './../../../models/position';
import { DragControls } from "three/examples/jsm/controls/DragControls.js";
import { GameSyncService } from './../../../services/game-sync.service';
import { World } from '../../model/World';
import { Component, ViewChild, OnInit, ElementRef, Input, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { WebsocketService } from 'src/app/services/websocket.service';
import { gsap } from 'gsap';
import { getCameraLookDir } from '../../utils/utils';
// import { addKeyBoardControl } from '../../utils/KeyBoardControls';
import { loadRoomModel } from '../../model/Room';
import { Vector3 } from 'three';
// import Stats from 'three/examples/jsm/libs/stats.module';

@Component({
  selector: 'app-game-scene',
  templateUrl: './game-scene.component.html',
  styleUrls: ['./game-scene.component.css']
})

export class GameSceneComponent implements OnInit, OnDestroy {

  @Input()
  roomId!: number;

  @ViewChild('room', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  /* 显示玩家用户名的2d平面（用3d text太拖垮性能了）*/
  @ViewChild('labelPanel', { static: true })
  labelPanelRef!: ElementRef<HTMLDivElement>;

  /***** @author mengtong 2022-06-16 13:49:01 *********
   显示答题结果
  ****************************************************/
  @ViewChild(AnswerResultComponent)
  resultComponent!: AnswerResultComponent;

  world!: World;
  ROOM_MODEL_PATH = ''
  roomModel!: THREE.Group;
  /* 墙，地板，天花板，门等的box3，用于碰撞检测，防止玩家穿墙 */
  confine: THREE.Box3[] = [];

  collisionOccur: boolean = false //碰撞发生
  collisionPrompt: string = "" //提示如何摆脱碰撞

  /* npc显示针对哪个checkpoint的引导
  -1 指npc加载进入游戏的引导
  undefined 指玩家在主页面，没有针对某个checkpoint
  正整数 表示玩家在和某个checkpoint交互
   */
  npcCheckpointId: number | undefined = NPC_NO_SPECIFIC;

  /***** @author mengtong 2022-05-19 12:43:13 *********
  游戏加载前的引导
  ****************************************************/

  loading: boolean = true;
  showNpc: boolean = false; //room model加载好后开始showNpc
  npcInstructFinish: boolean = false; // npc引导结束，show chat
  loadProgress: number = 0; //加载进度
  /*index是checkpointid,value是is solved */
  checkpointState: boolean[] = [];

  /***** @author mengtong 2022-06-14 19:56:56 *********
   开门的密码锁,之所以要用一堆viewchild，是因为viewchildren检测变化很烦
  ****************************************************/
  @ViewChild('key0', { static: true })
  key0!: ElementRef;
  @ViewChild('key1', { static: true })
  key1!: ElementRef;
  @ViewChild('key2', { static: true })
  key2!: ElementRef;
  @ViewChild('key3', { static: true })
  key3!: ElementRef;
  @ViewChild('key4', { static: true })
  key4!: ElementRef;

  keys!: ElementRef[];
  inputLength: number = 0;
  helperVector: THREE.Vector3 = new THREE.Vector3(); //坐标系转换时使用的中间向量

  /***** @author mengtong 2022-06-15 17:56:15 *********
   * 物品栏   
  ****************************************************/
  itemCheckpoints: number[] = []

  @ViewChild(ItemColumnComponent)
  itemCollection!: ItemColumnComponent;


  /***** @author mengtong 2022-06-18 04:34:35 *********
   退出时及时清除一些一直循环的任务
  ****************************************************/
  renderId!: number;
  intervalId!: any;


  /***** @author mengtong 2022-05-19 12:42:49 *********
   主场景
   1. 全景模式
   2. 检查模式（相机去靠近物体）
  ****************************************************/

  /*bgm开关,默认*/
  bgm_on: boolean = false;

  /*玩家在主场景中选择物体*/
  isDragging: boolean = false; //用来判断鼠标是单击还是拖动
  private selectRaycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(); //鼠标位置
  private selectedObjects: any[] = []; //当前选中物体

  /*玩家位置移动时动画平滑切换*/
  upVector3: THREE.Vector3 = new THREE.Vector3(0, 1, 0);
  // 其他玩家
  playerQuaternion: THREE.Quaternion[] = [];
  // 自己
  selfQuaternion: THREE.Quaternion = new THREE.Quaternion()

  //检查模式
  inCheckMode: boolean = false;

  /* 是否正有光追随着鼠标
   * 开启条件： 在checkMode 下开灯
   * 关闭条件：关灯 或者 不关灯直接退出checkmode
   */
  isLightFollowingMouse: boolean = false;

  /***** @author mengtong 2022-05-19 12:44:45 *********
   次场景
   1. 悬浮模式（物体去靠近相机，相机不动）   
  ****************************************************/

  inFloatMode: boolean = false; //物体主动凑近相机的模式
  focusingObj!: THREE.Object3D; // 在floatMode中正在漂浮着展示的物体
  worldVector: THREE.Vector3 = new THREE.Vector3() // 进入floatMode需要将local的position/scale等转换成world position/scale
  worldQuaternion: THREE.Quaternion = new THREE.Quaternion()
  //在放大悬浮模式下选择物品
  private floatRaycaster = new THREE.Raycaster();
  private floatSelectedObject: any[] = []

  //加载材质（changeMaterial）
  textureLoader: THREE.TextureLoader = new THREE.TextureLoader()


  /***** @author mengtong 2022-06-17 11:30:59 *********
   查看性能
  ****************************************************/
  stats!: any;

  constructor(private webSocketService: WebsocketService,
    private gameSyncService: GameSyncService,
    private loaderService: NgxUiLoaderService) { }

  ngOnDestroy(): void {
    console.log('on game scene destroy')

    if (this.webSocketService.socket != undefined) {
      this.webSocketService.socket.close()
    }
    this.webSocketService.socket = undefined

    // remove所有标签
    this.labelPanelRef.nativeElement.innerHTML = ''

    cancelAnimationFrame(this.renderId);
    window.clearInterval(this.intervalId)
    this.removeAllListeners()

    // 停止播放音乐
    if (this.world.bgmAudio && this.world.bgmAudio.isPlaying) {
      this.world.bgmAudio.stop()
    }

    // 清除场景中的物体
    this.disposeScene(this.world.scene)
    this.world.scene.remove.apply(this.world.scene, this.world.scene.children);
    this.disposeScene(this.world.detailScene)
    this.world.detailScene.remove.apply(this.world.detailScene, this.world.detailScene.children);

    // 场景中的参数释放清理或者置空等
    this.world.renderer.forceContextLoss();
    this.world.renderer.dispose();

    // 引用为null
    this.world.clearWorld()
  }

  /**
   * 停止loader
   */
  stopLoader() {
    this.loaderService.stopLoader('gameloader')
  }

  ngOnInit() {
    console.log('GameScene Component oninit')
    this.ROOM_MODEL_PATH = "../../../assets/room_3d_model/room" + this.roomId + ".glb"

    if (!this.webSocketService.socket) {
      this.webSocketService.connect(this.roomId)
    }

    // remove所有标签
    this.labelPanelRef.nativeElement.innerHTML = ''

    // 注册监听器，将事件分配给处理器
    this.gameSyncService.dispatchEvents(this);
    // 发送给后端new_user事件，汇报自己新加入，得到其他玩家的信息
    this.gameSyncService.emit('new_user', "")
    // 得到其他当前密室线索的状态
    this.gameSyncService.emit('checkpoint_state', "")

    // 把世界相关的基本元素封装起来了
    this.world = new World(this.canvasRef.nativeElement, this.labelPanelRef.nativeElement)
    this.buildScene(this.world);

    // 增加键盘控制，包含了碰撞检测
    // addKeyBoardControl(this)

    // 设定实时共享位置
    this.intervalId = setInterval(() => {
      //其实这里没有把四元数当四元数用，只是存了一个y，是相机在水平面上旋转的角度（radian）
      const rotation = new THREE.Quaternion()
      rotation.set(0, this.world.control.azimuthAngle, 0, 0)

      let posMsg: Position = {
        x: this.world.camera.position.x,
        y: this.world.camera.position.y,
        z: this.world.camera.position.z,
        rotation: rotation,
        action: this.world.myPlayerAction
      }
      this.gameSyncService.emit('position', posMsg)
    }, 1000)

    this.keys = [this.key0, this.key1, this.key2, this.key3, this.key4]
    this.renderView()
  }

  setNPCCheckpointId(checkpointId: number | undefined) {
    if (checkpointId != undefined) {
      this.npcCheckpointId = checkpointId
    } else {
      this.npcCheckpointId = NPC_NO_SPECIFIC
    }
  }

  npcFinishInstruction() {
    this.npcInstructFinish = true;
    this.turnOnBgm()
    this.addAllEventListeners()
  }

  /***** @author mengtong 2022-05-19 12:46:50 *********
   场景设置
  ****************************************************/

  /**
   * 搭建和具体room有关的场景
   * @param world 封装了和具体room无关的世界设定
   */
  buildScene(world: World) {
    // 环境光
    const bgLight = new THREE.AmbientLight(0xffffff, 0.3);
    /* 在两个窗户那里加平行光源 */
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3); //平行日光
    directionalLight.position.set(-200, 150, -100) //位置在窗户
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(220, 150, -200)

    // 在天花板增加顶部点光源
    const pointLight = new THREE.PointLight(0xffffff, 1)
    pointLight.position.set(-50, 300, 200)
    // // 在镜子对面增加点光源
    // const pointLight2 = new THREE.PointLight(0xffffff,0.5)
    // pointLight2.position.set(100,150,-100)

    world.scene.add(directionalLight, directionalLight2, bgLight, pointLight);
    this.world.mainSceneLight = [directionalLight, directionalLight2, pointLight]

    loadRoomModel(this);

    // TODO: 正式发布时删掉
    // this.stats = Stats();
    // this.stats.showPanel(0);
    // document.body.appendChild(this.stats.dom);
  }

  /**
   * 渲染
   */
  renderView() {
    let component: GameSceneComponent = this;

    (function render() {
      component.renderId = requestAnimationFrame(render)

      //更新相机位置
      const delta = component.world.clock.getDelta()
      component.world.control.update(delta);

      //柔和地更新转向
      component.world.playerMap.forEach((player, socketId) => {
        if (component.playerQuaternion[socketId]) {
          player.quaternion.slerp(component.playerQuaternion[socketId], 0.03);
        }
      })

      //更新玩家动画
      component.world.playerAnimationMap.forEach((mixer, socketId) => {
        // console.log(socketId,mixer)
        if (mixer) {
          mixer.update(delta);
        }
      })

      // 更新物体动画
      component.world.objectMixer && component.world.objectMixer.update(delta);
      component.world.detailMixer && component.world.detailMixer.update(delta);

      // 更新npc动画
      component.world.npcMixer && component.world.npcMixer.update(delta);

      //更新用户名标签位置
      component.world.labelRenderer.render(component.world.scene, component.world.camera);

      // 渲染：两个场景+一些后期处理
      component.world.composer.render(delta)

      // component.stats.update()
    }());
  }

  /***** @author mengtong 2022-05-19 12:48:02 *********
   玩家鼠标移动时记录碰到的物体
  ****************************************************/

  /**
   * 检查鼠标选中物体
   */
  checkIntersection() {
    // npc引导结束后开始正常
    if (!this.npcInstructFinish) { return }

    // 在悬浮模式中，更新次场景中的raycaster
    if (this.inFloatMode) {
      this.floatRaycaster.setFromCamera(this.mouse, this.world.detailCamera);
      const selectIntersections = this.floatRaycaster.intersectObjects(this.world.detailScene.children, true)
      this.floatSelectedObject = selectIntersections
    }
    // 不在悬浮模式中，那么更新主场景中的raycaster
    else {
      // 通过摄像机和鼠标位置更新射线
      this.selectRaycaster.setFromCamera(this.mouse, this.world.camera);
      // 计算物体和射线的焦点
      const selectIntersects = this.selectRaycaster.intersectObjects(this.world.scene.children, true)

      if (selectIntersects.length > 0) {
        const selectedObject = selectIntersects[0].object;
        this.addSelectedObject(selectedObject);
      }

      // 高亮选中的物体
      this.world.outlinePass.selectedObjects = this.selectedObjects
    }
  }

  /**
   * 主场景中的raycaster选择物体
   */
  addSelectedObject(obj: THREE.Object3D) {
    this.selectedObjects = []

    if (!this.isUnselectable(obj)) {
      let selected: THREE.Object3D = obj;

      // 如果选中的是一部分，改选成整个物体, 比如fork
      if (obj.userData['selectGroup']) {
        selected = this.world.scene.getObjectByName(obj.userData['selectGroup'])!
      }
      this.selectedObjects.push(selected)
    }
  }

  /* 那些不可以被用户选中的物件 */
  isUnselectable(o: THREE.Object3D) {
    return o.userData['unselectable'] ||
      o.name.includes("Wall") ||
      o.name.includes('Door') ||
      o.name.includes("Floor") ||
      o.name.includes("Celling")
  }

  /***** @author mengtong 2022-05-19 12:16:01 *********
   和游戏线索交互有关的鼠标事件监听,不用host listener，因为没法取消监听
  ****************************************************/

  addAllEventListeners() {
    document.addEventListener('pointermove', this.onPointerMove)
    document.addEventListener('mousedown', this.onMouseDown)
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseup', this.onMouseClickObject)
  }

  removeAllListeners() {
    document.removeEventListener('pointermove', this.onPointerMove)
    document.removeEventListener('mousedown', this.onMouseDown)
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseup', this.onMouseClickObject)
  }

  /* 移动鼠标高亮物体边缘,使用尖头函数是因为考虑this的值 */
  // @HostListener('document:pointermove', ['$event'])
  onPointerMove = (event: any) => {
    // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    if (event.isPrimary === false) { return }
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // 检查鼠标移动时遇到哪些物体
    this.checkIntersection();

    // 在主模式下悬停物体的交互
    if (!this.inFloatMode) {
      this.onHoverObject()
    }

    // 更新灯位置让它追随鼠标（仅在checkMode并且点了蜡烛的情况下）
    if (this.isLightFollowingMouse) {
      //屏幕坐标系转成世界坐标系
      const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5);
      vector.unproject(this.world.camera);
      const dir = vector.sub(this.world.camera.position).normalize();
      const distance = -this.world.camera.position.z / dir.z;
      const pos = this.world.camera.position.clone().add(dir.multiplyScalar(distance));

      this.world.followMouseLight.position.copy(new THREE.Vector3(pos.x, pos.y, pos.z + 2));
    }
  }

  /* 在主场景下 鼠标悬停经过某物件时的事件，比如点燃蜡烛 */
  onHoverObject() {
    const cursorStyle: string[] = ['cursorfire', 'cursorsoundon', 'cursorsoundoff']
    if (this.selectedObjects.length > 0 && this.selectedObjects[0].name.includes('Candle')) { //提示是否点燃蜡烛（更改鼠标样式）
      this.canvasRef.nativeElement.classList.add('cursorfire')
    } else if (this.selectedObjects.length > 0 && this.selectedObjects[0].name.includes('Phonograph')) { //留声机
      this.toggleMouseStyleForBgm()
    } else {
      this.canvasRef.nativeElement.classList.remove(...cursorStyle)
    }
  }

  /* 改变hover到留声机上的鼠标样式 */
  toggleMouseStyleForBgm() {
    if (this.bgm_on) {// 显示关掉的图标
      this.canvasRef.nativeElement.classList.add('cursorsoundoff')
    } else {
      this.canvasRef.nativeElement.classList.add('cursorsoundon')
    }
  }

  /* 为了区分click和drag，为onMouseClickObject服务 */
  // @HostListener('document:mousedown', ['$event'])
  onMouseDown = (event: any) => {
    this.isDragging = false
  }

  /* 为了区分click和drag, 为onMouseClickObject服务 */
  // @HostListener('document:mousemove', ['$event'])
  onMouseMove = (event: any) => {
    this.isDragging = true
  }

  /* 是否在主场景的全景模式下 */
  private inFullViewMode() {
    return !this.inFloatMode && !this.inCheckMode;
  }

  /* 
   * 点击后和物体互动的逻辑：
   * 用户鼠标单击选择物体，不同物体会有不同反应
   * 
   * 游戏模式：
   * 1. 全景模式 fullMode 正常环顾四周，在主场景中
   * 2. 检查模式 checkMode 相机凑近去观察物体，仍然在主场景中，可以点击其他附近的物体将相机的焦点转移，退出会回到进入checkMode时的相机位置
   * 3. 悬浮模式 floatMdoe 相机不动，物体凑近相机，进入次场景和物体进行互动，退出会回到进入时的相机位置
   * 
   * 注：不用click事件是因为会和鼠标拖动混淆，用mouseup来计算有无位移，来区分click和drag 
  */
  // @HostListener('document:mouseup', ['$event'])
  onMouseClickObject = (event: any) => {
    //是拖动不是单击，就返回
    if (this.isDragging) { return }

    // 已经进入floatMode, 对次场景中的物体互动，用floatRaycaster
    if (this.inFloatMode) {
      this.onClickInFloatingMode()
    }
    // 在主场景中
    else {
      if (this.selectedObjects.length == 0) { return }
      const selected = this.selectedObjects[0]

      // 从其他模式进入floatMode, 相机不移动，物体移动过来展示
      if (selected.userData['floatNear']) {
        this.enterFloatMode(selected)
      }

      // 在fullMode或checkMode下, 点燃蜡烛
      if (selected.name.includes('Candle')) {
        this.lightUpOrDown(selected)
      }

      // 在fullMode或checkMode下，放大选中物体
      if (selected.userData['closeCheck']) {
        this.enterCheckMode(selected)
      }

      // 在fullMode或checkMode下，轻微移动选中物体位置，比如抬起pillow,露出下面的纸条
      if (selected.userData['move']) {
        this.toggleMove(selected)
      }

      // 在fullMode下，点击物体播放动画(一次)，如留声机
      if (this.inFullViewMode() && selected.userData['animation']) {
        if (selected.userData['toggle'] !== undefined) {
          selected.userData['toggle'] = this.toggleSound(selected, selected.userData['toggle'])
        }
      }

      // 点击密码锁的键，增加输入
      if (this.inCheckMode && selected.userData['keyword'] != undefined) {
        this.inputKey(selected)
      }

      // 这个物体被点击后要加入物品栏
      if (selected.userData['collection'] != undefined
        && !this.itemCheckpoints.includes(selected.userData['collection'])) {
        // 数组中增加
        this.itemCheckpoints.push(selected.userData['collection'])
        // 物品栏闪烁3s提示有新增
        this.itemCollection.shine()
      }
    }
  }

  /***** @author mengtong 2022-05-19 12:49:33 *********
   点击后物体交互的反应
  ****************************************************/
  /* 门锁输入一个键，显示出来 */
  inputKey(pressedKey: THREE.Object3D) {
    let spanElement = this.keys[this.inputLength].nativeElement;
    spanElement.innerHTML = pressedKey.name
    //找到应该显示的位置：在灯的屏幕坐标处
    const position = this.localPos2ScreenPos(this.world.scene.getObjectByName(this.inputLength + 'Input')!, this.world.camera)
    //修改当前输入的键的显示位置
    spanElement.style.left = position.x + 'px';
    spanElement.style.top = position.y + 'px';
    spanElement.style.transform = "translate(-50%, -50%)";
    this.inputLength++;

    // 检查是否填完密码
    if (this.inputLength == 5) {
      //组装成答案
      let answer = ''
      this.keys.forEach((elementRef) => {
        answer += elementRef.nativeElement.innerHTML;
      })
      this.inputLength = 0;
      //向后端发请求验证密码是否正确
      let data = {
        checkpoint: 7,
        answer: answer
      }
      this.gameSyncService.emit('try_answer', data);
      window.setTimeout(() => {
        this.clearKeyInput()
      }, 2000);
    }
  }

  /**
   * 清空已输入的门锁密码
   */
  clearKeyInput() {
    this.keys.forEach((elementRef) => {
      elementRef.nativeElement.innerHTML = ''
    })
    this.inputLength = 0
  }

  /**
   * helper: 将本地坐标转换成屏幕坐标
   */
  localPos2ScreenPos(obj: THREE.Object3D, camera: THREE.PerspectiveCamera) {
    this.helperVector.setFromMatrixPosition(obj.matrixWorld);
    this.helperVector.project(camera);

    var width = window.innerWidth, height = window.innerHeight;
    var widthHalf = width / 2, heightHalf = height / 2;

    this.helperVector.x = (this.helperVector.x * widthHalf) + widthHalf;
    this.helperVector.y = -(this.helperVector.y * heightHalf) + heightHalf;

    return this.helperVector;
  }

  /* 切换bgm的开关状态；返回切换后的新状态 */
  toggleSound(obj: any, state_on: number) {
    this.bgm_on = !state_on
    if (state_on) { //原来开着，现在关掉
      this.resetAnimation(obj)
      this.turnOffBgm()
      return 0
    } else {//原来关着，现在打开
      this.playAnimationOnce(obj)
      this.turnOnBgm()
      return 1
    }
  }

  /**
   * 播放一次动画
   */
  playAnimationOnce(obj: any) {
    const clip = obj.animations[0]
    let action
    if (this.inFloatMode) {
      this.world.detailMixer = new THREE.AnimationMixer(obj)
      this.world.detailMixer.stopAllAction()
      action = this.world.detailMixer.clipAction(clip)
    } else {
      this.world.objectMixer.stopAllAction()
      action = this.world.objectMixer.clipAction(clip)
    }
    action.clampWhenFinished = true
    action.setLoop(THREE.LoopOnce, 1)
    action.play()
  }

  /**
   * 重置成没播动画前的样子
   */
  resetAnimation(obj: any) {
    this.world.objectMixer.stopAllAction()
    const animationClip = obj.animations[0];
    const animationAction = this.world.objectMixer.clipAction(animationClip);
    animationAction.reset();
  }

  turnOnBgm() {
    this.bgm_on = true;
    // 没有初始化就初始化
    if (!this.world.bgmAudio) {
      // 创建一个 AudioListener 并将其添加到 camera 中
      const listener = new THREE.AudioListener();
      this.world.camera.add(listener);

      // 创建一个全局 audio 源
      const sound = new THREE.Audio(listener);

      // 加载一个 sound 并将其设置为 Audio 对象的缓冲区
      const audioLoader = new THREE.AudioLoader();
      audioLoader.load('../../../../assets/bgm/bgm.m4a', function (buffer) {
        sound.setBuffer(buffer);
        sound.setLoop(true);
        sound.setVolume(0.3);
        sound.play();
      });
      this.world.bgmAudio = sound
    } else {
      this.world.bgmAudio.play()
    }
  }

  turnOffBgm() {
    this.bgm_on = false;
    if (this.world.bgmAudio && this.world.bgmAudio.isPlaying) {
      this.world.bgmAudio.pause()
    }
  }

  toggleMove(obj: THREE.Object3D) {
    const enum moveState {
      notMoveYet,
      alreadyMove
    }

    let realDistance: number;
    let newState: number;

    const direction: string = obj.userData['move']

    // 从notMoveYet到alreadyMove需要在对应的轴上移动多少距离
    let positiveDist = direction == 'z' ? 30 : //z是水平方向，+30指向浴缸方向
      direction == 'y' ? 40 : //y是竖直方向，+40指向天花板
        -40

    // 根据目前的状态确定如何移动
    if (obj.userData['moved'] == moveState.alreadyMove) {
      realDistance = -positiveDist
      newState = moveState.notMoveYet
    } else {
      realDistance = positiveDist
      newState = moveState.alreadyMove
    }

    gsap.to(obj.position, { duration: 2, [direction]: <number>obj.position[direction as keyof Vector3] + realDistance })
    obj.userData['moved'] = newState
  }

  turnOffFollowMouseLight() {
    this.isLightFollowingMouse = false
    this.world.followMouseLight.intensity = 0
  }

  turnOnFollowMouseLight() {
    this.isLightFollowingMouse = true
    this.world.followMouseLight.intensity = 0.5
  }

  /**
   * 在悬浮模式下点击物体的部件进行互动
   */
  onClickInFloatingMode() {
    if (this.floatSelectedObject.length == 0) { return }
    let selected: THREE.Object3D | undefined;

    //找到第一个可见的被选中的物体（因为有些物体被隐藏了，点了不算选中）
    for (let i = 0; i < this.floatSelectedObject.length; i++) {
      selected = this.floatSelectedObject[i].object
      if (selected!.visible) {
        break
      }
    }

    //没有可以显示的选中的物体
    if (selected == undefined) { return }
    //点击后隐藏一个物品
    if (selected.userData['hide']) {
      this.fadeOutObj(selected.userData['hide'], selected.userData['show'])
    }
    //点击后显示一个物品
    if (selected.userData['show']) {
      this.setNPCCheckpointId(selected.userData['id'])
      this.fadeInObj(selected.userData['show'])
    }

    if (selected.userData['animation']) {// 点击后播放动画
      this.playAnimationOnce(selected)
    }

    if (selected.userData['material']) { //点击后更换材质，比如电脑开机
      this.setNPCCheckpointId(selected.userData['id'])
      this.changeMaterial(selected.userData['material'], true)
      selected.userData['materialName'] = 0 //一次性更换
    }

    // 这个物体被点击后要加入物品栏
    if (selected.userData['collection'] != undefined
      && !this.itemCheckpoints.includes(selected.userData['collection'])) {
      // 数组中增加
      this.itemCheckpoints.push(selected.userData['collection'])
      // 物品栏闪烁3s提示有新增
      this.itemCollection.shine()
    }
  }

  /**
   * 让物体逐渐淡出
   * @param obj_name 淡出的物体名称
   * @param exceptObj 除了其中的这个child不淡出
   */
  fadeOutObj(obj_name: string, exceptObj: string) {
    const obj = this.world.detailScene.getObjectByName(obj_name)!
    obj.traverse(o => {
      if ((<THREE.Mesh>o).isMesh && !o.name.includes(exceptObj)) {
        // console.log(o.name, 'except:', exceptObj);
        ((o as THREE.Mesh).material as THREE.Material).transparent = true;
        gsap.to((o as THREE.Mesh).material, {
          duration: 1,
          opacity: 0,
          onComplete: () => {
            o.visible = false;
          }
        })
      }
    });
  }

  /**
   * 让物体逐渐淡入
   */
  fadeInObj(obj_name: string) {
    const obj = this.world.detailScene.getObjectByName(obj_name)!
    obj.lookAt(this.world.detailCamera.position); //正面对着相机
    obj.visible = true

    obj.traverse(o => {
      if ((<THREE.Mesh>o).isMesh) {
        ((o as THREE.Mesh).material as THREE.Material).transparent = true;
        gsap.fromTo((o as THREE.Mesh).material, { opacity: 0 }, {
          duration: 1,
          opacity: 1
        })
      }
    });

    // 调整control的target成刚显示的对象
    obj.getWorldPosition(this.worldVector)
    this.world.detailControl.target = this.worldVector
  }

  /**
   * 更换物体材质
   */
  changeMaterial(targetName: string, useGlitchEffect: boolean) {
    const targetObj = this.world.detailScene.getObjectByName(targetName) as THREE.Mesh
    // blender里不能直接导出没有使用的material，因此用一个隐藏的dummy object来使用替换的material
    const material = (this.world.detailScene.getObjectByName(`Dummy${targetName}`) as THREE.Mesh).material
    targetObj.material = material

    let world = this.world
    // 使用画面扭曲的特效
    if (useGlitchEffect) {
      world.glitchPass.enabled = true
      window.setTimeout(() => {
        world.glitchPass.enabled = false
      }, 2000)
    }
  }

  lightUpOrDown(obj: THREE.Object3D) {
    const enum Intensity {
      off,
      on
    }
    let light: any = obj.getObjectByName('light')

    // 灯亮着，关灯
    if (light && light.intensity == Intensity.on) {
      light.intensity = Intensity.off

      //关闭追光灯
      if (this.isLightFollowingMouse) {
        this.turnOffFollowMouseLight()
      }
    }

    // 开灯
    else {
      //没有开过，初始化一个灯
      if (!light) {
        light = new THREE.PointLight(0xffffff, Intensity.on)
        light.distance = 30
        light.name = 'light'
        obj.add(light)
      }
      // 点过灯，现在关着，开灯
      else {
        light.intensity = Intensity.on
      }

      // 让一束光跟随鼠标移动
      if (this.inCheckMode) {
        this.turnOnFollowMouseLight()
      }
    }
  }

  /***** @author mengtong 2022-05-19 12:50:19 *********
   三种模式的切换
  ****************************************************/

  enterCheckMode(objUnderCheck: THREE.Object3D) {
    // 点击退出时也会触发，如果是自己就直接返回
    if(this.inCheckMode && objUnderCheck==this.focusingObj){ return }
    // 从全景模式到单个物体的模式,保存相机位置，以便之后恢复
    if (!this.inCheckMode) {
      //保存当时的相机位置状态
      this.world.control.saveState()
    }
    this.inCheckMode = true;
    this.focusingObj = objUnderCheck

    // 要先关闭碰撞检测，不然fitToBox最终位置会出错
    if (this.world.control.colliderMeshes.length != 0) {
      this.world.control.colliderMeshes = []
    }
    this.world.control.fitToBox(objUnderCheck, true,
      { paddingTop: 10, paddingLeft: 10, paddingBottom: 10, paddingRight: 10 }
    )
    window.setTimeout(() => {
      // 因为要关闭碰撞检测 防止用户乱动，播完动画禁用control
      // 要是用户很快退出了checkMode，就不用设置了
      if(this.inCheckMode){
        this.world.control.enabled = false
      }
    }, 3000)
  }

  /**
   * 从其他模式进入悬浮模式
   * 从主场景进入次场景
   */
  enterFloatMode(focusObj: THREE.Object3D) {
    // 把控制权交给detail场景
    this.inFloatMode = true;
    this.focusingObj = focusObj;
    focusObj.visible = false; // 在主场景中的物体隐藏，次场景中会显示它

    this.world.control.enabled = false;

    // 同步主场景中的相机位置和角度
    this.world.detailCamera.copy(this.world.camera)

    // 主场景变暗
    gsap.to(this.world.mainSceneLight, { duration: 1, intensity: 0 })

    //克隆物体(此时clone的material还reference原来的material)
    const selected = this.focusingObj.clone()
    //克隆material
    selected.traverse(function (object) {
      if ((<THREE.Mesh>object).isMesh) {
        const mesh = object as THREE.Mesh
        mesh.material = (mesh.material as THREE.Material).clone();
      }
    });

    // 同步主场景中的物体的位置和角度
    // 直接的position是相对于parent的，world position是相对于世界中心，要把local->world(因为detailScene里面不克隆选中物体的parent)
    this.focusingObj.getWorldPosition(this.worldVector)
    selected.position.copy(this.worldVector)
    this.focusingObj.getWorldScale(this.worldVector)
    selected.scale.copy(this.worldVector)
    this.focusingObj.getWorldQuaternion(this.worldQuaternion)
    selected.quaternion.copy(this.worldQuaternion)

    // clone不会克隆动画,手动复制
    selected.animations = this.focusingObj.animations
    selected.visible = true

    // 加入场景
    this.world.detailScene.add(selected)
    this.world.detailScene.userData['select'] = selected

    // 加聚光灯
    this.world.detailLight.target = selected
    const moveTo = this.moveObjTowardsCamera(2, selected)
    this.world.detailControl.target = moveTo

    // 如果有某部分可以拖动，增加dragcontrol
    if (selected.userData['drag']) {
      const dragControls = new DragControls(
        [this.world.detailScene.getObjectByName(selected.userData['drag'])!],
        this.world.detailCamera, this.world.renderer.domElement);

      let world = this.world
      dragControls.addEventListener('dragstart', function () { world.detailControl.enabled = false; });
      dragControls.addEventListener('dragend', function () { world.detailControl.enabled = true; });
    }

    // 自动显示npc
    this.setNPCCheckpointId(selected.userData['id'])
  }

  // 物体飘到相机前
  moveObjTowardsCamera(seconds: number, obj: THREE.Object3D) {
    // 物体飘到相机前
    const lookDir = getCameraLookDir(this.world.detailCamera)
    const moveTo = new THREE.Vector3(
      this.world.detailCamera.position.x + lookDir.x * 100,
      this.world.detailCamera.position.y + lookDir.y * 100,
      this.world.detailCamera.position.z + lookDir.z * 100)

    gsap.to(obj.position, {
      duration: seconds,
      x: moveTo.x,
      y: moveTo.y,
      z: moveTo.z,
    })
    return moveTo
  }

  /**
   * 退出按钮逻辑
   */
  backToFullView() {
    if (this.inCheckMode) {
      this.exitCheckMode()
    }
    if (this.inFloatMode) {
      this.exitFloatMode()
      this.setNPCCheckpointId(NPC_HIDE)
    }
  }

  /**
   * 从放大检查一个线索的模式中退出，回到原来相机位置
   */
  exitCheckMode() {
    this.inCheckMode = false
    // 打开碰撞检测，启用control
    this.world.control.enabled = true
    this.world.control.reset()
    this.world.control.colliderMeshes = this.world.scene.getObjectByName('room')?.children!

    if (this.isLightFollowingMouse) {
      this.turnOffFollowMouseLight()
    }

    // 清空按键
    this.clearKeyInput()
  }

  exitFloatMode() {
    this.world.control.enabled = true;

    this.inFloatMode = false
    this.focusingObj.visible = true; //重新让主场景中的物品可见

    // 主场景变量
    gsap.to(this.world.mainSceneLight, { duration: 1, intensity: 0.3 })

    //把细节场景中的物体删除
    this.clearGroup(this.world.detailScene.userData['select'])
    this.world.detailScene.remove(this.world.detailScene.userData['select'])

    // 清除mixer
    this.world.detailMixer = undefined!

    this.world.detailDragControl = undefined!
  }

  /***** @author mengtong 2022-06-15 20:00:12 *********
   * Helper function   
  ****************************************************/

  /**删除物体时清除缓存，提高性能 */
  clearGroup(obj: THREE.Object3D) {
    obj.traverse(o => {
      if ((<THREE.Mesh>o).isMesh) {
        const mesh = o as THREE.Mesh
        mesh.geometry.dispose();

        // 当multimaterial，是个数组
        if (mesh.material instanceof Array) {
          mesh.material.forEach((material) => {
            material.dispose()
          })
        }
        // 一个材质
        else {
          (mesh.material as THREE.Material).dispose()
        }
      }
    });
  }

  disposeScene(scene: THREE.Scene) {
    scene.traverse((child: any) => {
      this.clearGroup(child)
    });
  }

  /**
   * 得到传给npc组件的checkpoint是否被解决
   */
  getSolved() {
    if (this.npcCheckpointId == undefined) {
      return false;
    }
    if (this.npcCheckpointId! >= 0) {// 正常的checkpoint
      return this.checkpointState[this.npcCheckpointId]
    } else {// 负数
      return false;
    }
  }
}