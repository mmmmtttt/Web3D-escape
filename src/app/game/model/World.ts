import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Action } from './Player'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import CameraControls from 'camera-controls';
import * as THREE from 'three';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

CameraControls.install({ THREE: THREE });
/**
 * 包装和具体密室无关的世界设定，如场景布置，数据储存
 */
export class World {

  // 主场景
  camera!: THREE.PerspectiveCamera;
  scene!: THREE.Scene
  mainSceneLight!: any[] //主光源，会随着进入次场景改变亮度
  followMouseLight!: THREE.PointLight
  cameraSphere!: THREE.Sphere // 包裹相机，检测碰撞
  outlinePass!: OutlinePass; //选择物体高亮
  glitchPass!: GlitchPass; // 在某些情况下的画面扭曲特效
  control!: CameraControls;
  /* 游戏线索的动画,在room.ts中的load里初始化*/
  objectMixer!: THREE.AnimationMixer;
  bgmAudio!: THREE.Audio;
  labelRenderer: CSS2DRenderer;

  // 细节场景
  detailLight!: any
  detailScene!: THREE.Scene
  detailCamera!: THREE.PerspectiveCamera
  detailControl!: OrbitControls
  detailMixer!: THREE.AnimationMixer;
  detailDragControl!: any;
  npcMixer!: THREE.AnimationMixer;

  // 两个场景共用
  renderer!: THREE.WebGLRenderer;
  composer!: EffectComposer //post processing
  clock!: THREE.Clock

  // 游戏数据相关
  playerMap!: Map<number, THREE.Group> //socketid => player 3d object
  playerAnimationMap!: Map<number, THREE.AnimationMixer> //socketid => animationmixer
  usernameLabelMap!: Map<number, any>
  myPlayerAction!: Action //主人公的动作

  constructor(canvas: HTMLCanvasElement,labelPanel:HTMLDivElement) {
    const world = this;

    /***** @author mengtong 2022-05-19 11:37:34 *********
     游戏数据初始化
    ****************************************************/

    world.playerMap = new Map()
    world.playerAnimationMap = new Map()
    world.usernameLabelMap = new Map()
    world.myPlayerAction = Action.idle;

    /***** @author mengtong 2022-05-19 11:37:50 *********
     两个场景公用的东西初始化
    ****************************************************/

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: false,
      alpha: false,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance"
    })
    // renderer.autoClear = false //为了渲染两个重叠的场景
    renderer.setPixelRatio(window.devicePixelRatio*0.8)
    renderer.outputEncoding = THREE.sRGBEncoding; //解决颜色偏差
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = true;
    this.renderer = renderer

    /* 初始化2d label的renderer */
    this.labelRenderer = new CSS2DRenderer({element:labelPanel});
    this.labelRenderer.setSize(window.innerWidth, window.innerHeight);

    world.clock = new THREE.Clock()

    /***** @author mengtong 2022-05-19 11:38:11 *********
     主场景初始化
     ****************************************************/

    world.scene = new THREE.Scene()

    world.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 700)
    world.scene.add(world.camera)

    // camera-controls设置
    world.control = new CameraControls(world.camera, renderer.domElement);
    world.control.setLookAt(80, 150, -200, 0, 150, 0)
    // world.control.mouseButtons.left = CameraControls.ACTION.NONE
    // world.control.mouseButtons.right = CameraControls.ACTION.NONE
    // world.control.mouseButtons.wheel = CameraControls.ACTION.NONE
    // world.control.mouseButtons.shiftLeft = CameraControls.ACTION.NONE
    // world.control.mouseButtons.middle = CameraControls.ACTION.NONE
    world.control.polarRotateSpeed = 0.05
    world.control.azimuthRotateSpeed = 0.05
    world.control.dollySpeed = 0.1
    world.control.truckSpeed = 0.5
    // world.control.boundaryEnclosesCamera = true
    world.control.minDistance = 20

    // 碰撞检测包裹相机的球体
    world.cameraSphere = new THREE.Sphere().set(world.control.camera.position, 50)
    // work around: 现在center还是(0,0,0)，为了不和地板碰撞，暂时设置为大于radius的一个数字
    world.cameraSphere.center.setY(60)

    world.control.addEventListener('control', () => { //开始
      console.log('camera control')
      world.myPlayerAction = Action.walking
    })

    // 监听控制改变来更新主人公动作
    world.control.addEventListener('sleep', () => { //鼠标滚轮结束
      world.myPlayerAction = Action.idle
    })

    world.followMouseLight = new THREE.PointLight(0xffffff, 0)
    world.scene.add(world.followMouseLight)


    /***** @author mengtong 2022-05-19 11:39:46 *********
     细节场景初始化
    ****************************************************/

    world.detailScene = new THREE.Scene()

    world.detailCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
    world.detailScene.add(world.detailCamera)

    //灯光
    world.detailScene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const detailLight = new THREE.PointLight(0xffffff, 0.5);
    // detailLight.distance = 100
    world.detailLight = detailLight
    world.detailCamera.add(detailLight); //跟随着相机

    world.detailControl = new OrbitControls(world.detailCamera, renderer.domElement)
    world.detailControl.enableZoom = true;
    world.detailControl.zoomSpeed = 0.5;
    world.detailControl.enableDamping = true;
    world.detailControl.dampingFactor = 0.25; // 阻尼系數

    /***** @author mengtong 2022-05-19 11:42:47 *********
     post processing
    ****************************************************/

    const effectFXAA = this.postProcessing(world, renderer);

    window.addEventListener('resize', () => {

      world.camera.aspect = window.innerWidth / window.innerHeight
      world.camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight)
      world.composer.setSize(window.innerWidth, window.innerHeight);

      effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    })
  }

  clearWorld(){
    this.camera = null!
    this.scene = null!
    this.mainSceneLight = null!
    this.followMouseLight = null!
    this.cameraSphere = null!
    this.outlinePass = null!
    this.glitchPass = null!
    this.control = null!
    this.objectMixer = null!
    this.bgmAudio = null!
    this.labelRenderer = null!
    this.detailLight = null!
    this.detailScene = null!
    this.detailCamera = null!
    this.detailControl = null!
    this.detailMixer = null!
    this.detailDragControl = null!
    this.npcMixer = null!
    this.renderer = null!
    this.composer = null!
    this.clock = null!
  }

  /*
  后期处理，类似ps的滤镜
  */
  postProcessing(world: World, renderer: THREE.WebGLRenderer) {
    world.composer = new EffectComposer(renderer);

    let renderPass = new RenderPass(world.scene, world.camera);
    // renderPass.clear = false
    renderPass.renderToScreen = true
    renderPass.clearDepth = true
    world.composer.addPass(renderPass);

    let detailRenderPass = new RenderPass(world.detailScene, world.detailCamera)
    detailRenderPass.clear = false
    detailRenderPass.renderToScreen = true
    detailRenderPass.clearDepth = true
    world.composer.addPass(detailRenderPass)

    const gammaCorrectionPass = new ShaderPass(GammaCorrectionShader);
    world.composer.addPass(gammaCorrectionPass);

    world.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), world.scene, world.camera);
    world.outlinePass.edgeStrength = 3
    world.outlinePass.edgeGlow = 0
    world.outlinePass.edgeThickness = 1
    world.outlinePass.pulsePeriod = 0
    world.outlinePass.usePatternTexture = false
    world.outlinePass.visibleEdgeColor.set('#ffffff')
    world.outlinePass.hiddenEdgeColor.set('#190a05')
    world.composer.addPass(world.outlinePass);

    world.glitchPass = new GlitchPass();
    world.glitchPass.enabled = false
    world.composer.addPass(world.glitchPass)

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('../../../assets/room_assets/tri_pattern.jpg', function (texture) {
      world.outlinePass.patternTexture = texture;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });

    const effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    world.composer.addPass(effectFXAA);
    return effectFXAA
  }
}
