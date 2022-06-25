import { Component, OnInit, ViewChild, AfterViewInit, ElementRef, Input } from '@angular/core';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from "three";
import { WebGLRenderer } from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

@Component({
  selector: 'app-figure-show',
  templateUrl: './figure-show.component.html',
  styleUrls: ['./figure-show.component.css']
})
export class FigureShowComponent implements OnInit, AfterViewInit {

  //从父组件传入子组件的属性
  @Input() modelPath!: string;

  @Input() showModel: boolean = false; //是否开始展示model

  constructor() { }

  ngOnInit(): void {
  }

  /**
   * 和虚拟形象有关
   */
  // Three.js相关
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private loader = new GLTFLoader();
  private model!: THREE.Group;
  private mixer!: THREE.AnimationMixer;
  private clock = new THREE.Clock();         // Used for anims, which run to a clock instead of frame rate 
  private sphere!: THREE.Points;

  private text!:any

  @ViewChild('js_loader')
  private loaderRef!: ElementRef;

  @ViewChild('c')
  private canvasRef!: ElementRef;

  private get loaderAnim(): HTMLDivElement {
    return this.loaderRef.nativeElement;
  }

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  private setUpScene() {
    this.scene = new THREE.Scene();
    this.scene.background = null; //背景透明
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0); //背景透明
    this.renderer.outputEncoding = THREE.sRGBEncoding; //解决颜色偏差
    this.renderer.shadowMap.enabled = true;
    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.addCamera();
    this.addLight();
    this.addBackgroundSphere();
    // this.addIntroductionText();
  }

  private addCamera() {
    // Add a camera
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.x = 0;
    this.camera.position.y = 1;
    this.camera.position.z = 30;
  }

  private addLight() {
    // Add lights
    let d = 8.25;
    let dirLight = new THREE.DirectionalLight(0xffffff, 0.54);
    dirLight.position.set(-8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1500;
    dirLight.shadow.camera.left = d * -1;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = d * -1;
    // Add directional Light to scene
    let ambientLight = new THREE.AmbientLight(0xffffff);
    this.scene.add(dirLight, ambientLight);
  }

  // private addBackgroundSphere() {
  //   // 我们的自定义 shader
  //   let vertexShader = `
  //   varying vec2 vertexUV;
  //   varying vec3 vertexNormal;

  //   void main() {
  //       vertexUV = uv;
  //       vertexNormal = normal;
  //       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
  //   }`;

  //   let fragmentShader = `
  //   uniform sampler2D globeTexture; //我们导入的texture
  //   varying vec2 vertexUV; //从vertexshader中声明的变量
  //   varying vec3 vertexNormal; //从vertexshader中声明的变量

  //   void main() {
  //       float intensity =1.05 - dot(vertexNormal, vec3(0.0,0.0,1.0));
  //       vec3 atmosphere = vec3(1,1,1)* pow(intensity,1.5);
  //       gl_FragColor = vec4(vec3(0, 0, 0) + texture2D(globeTexture, vertexUV).xyz, 1.0);
  //   }`;

  //   let atmosphereVertexShader=`
  //   varying vec3 vertexNormal;
  //   void main() {
  //       vertexNormal = normal;
  //       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
  //   }
  //   `;
  //   let atmosphereFragmentShader=`
  //     varying vec3 vertexNormal; // (0, 0, 0)
  //     void main() {
  //         float intensity = pow(0. - dot(vertexNormal, vec3(0, 0, 1.0)),2.0)
  //         gl_FragColor = vec4(1,1,1,1.0)* intensity;
  //     }
  //   `;
  //   //创造球体
  //   this.sphere = new THREE.Mesh(
  //     new THREE.SphereGeometry(8, 34, 34),
  //     new THREE.ShaderMaterial({ //自定义的shader
  //       vertexShader,
  //       fragmentShader,
  //       uniforms: {
  //         globeTexture: {
  //           value: new THREE.TextureLoader().load('../../../assets/texture/moon.jpg')
  //         }
  //       }
  //     }));
  //   this.sphere.position.x = 0; //左右
  //   this.sphere.position.y = 7.5; //上下 
  //   this.sphere.position.z = -15; //纵深
  //   // this.scene.add(this.sphere);

  //   //创造球体周围的光晕
  //   const atmosphere: THREE.Mesh = new THREE.Mesh(
  //     new THREE.SphereGeometry(8, 34, 34),
  //     new THREE.ShaderMaterial({ //自定义的shader
  //       vertexShader: atmosphereVertexShader,
  //       fragmentShader: atmosphereFragmentShader,
  //       blending: THREE.AdditiveBlending,
  //       side:THREE.BackSide
  //     }));
  //   atmosphere.scale.set(1.1,1.1,1.1);
  //   atmosphere.position.x = 0; //左右
  //   atmosphere.position.y = 8; //上下 
  //   atmosphere.position.z = -15; //纵深
  //   this.scene.add(atmosphere);
  // }

  // private addIntroductionText() {
  //   //加载json格式的字体
  //   const loader = new FontLoader()
  //   loader.load('../../../assets/player_3d_model/Cheri_Regular.json', (font: Font)=>{
  //     // Materials
  //     const material = new THREE.PointsMaterial({
  //       size: 0.07
  //     })
  //     material.color = new THREE.Color(0xffffff)

  //     const geometry = new TextGeometry('ESCAPE', {
  //       font: font,
  //       size: 5,
  //       height: 2,
  //     })
  //     this.text = new THREE.Points(geometry, material)
  //     this.text.position.x = -15; //左右
  //     this.text.position.y = 7.5; //上下 
  //     this.text.position.z = -15; //纵深
  //     this.text.rotation.y = 15;
  //     this.scene.add(this.text)
  //   })
  // }

  private addBackgroundSphere() {
    //创造球体周围的光晕
    // Objects
    const geometry = new THREE.TorusGeometry(8, 3, 16, 100);

    // Materials
    const material = new THREE.PointsMaterial({
      size: 0.07
    })
    material.color = new THREE.Color(0xffffff)

    // Mesh
    this.sphere = new THREE.Points(geometry, material)
    this.sphere.position.x = 0; //左右
    this.sphere.position.y = 7.5; //上下 
    this.sphere.position.z = -15; //纵深
    this.scene.add(this.sphere)
  }


  private loadModel() {
    //load the model
    let component: FigureShowComponent = this;

    // component.material = new THREE.MeshPhongMaterial({
    //   transparent: false
    // });

    this.loader.load(
      component.modelPath,
      (gltf) => {
        // A lot is going to happen here
        component.model = gltf.scene;
        let fileAnimations = gltf.animations;
        component.model.traverse(o => {
          if ((<THREE.Mesh>o).isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            // (<THREE.Mesh>o).material = component.material; 
          }
        });
        // Set the models initial scale
        component.model.scale.set(11, 11, 11);
        component.model.position.y = -5;
        component.scene.add(component.model);
        component.model.visible = false;
        component.loaderAnim.remove();
        console.log("model is loaded at" + component.model.position.x + "," + component.model.position.y + "," + component.model.position.z,'animations',fileAnimations);
        component.mixer = new THREE.AnimationMixer(component.model);
        let greetAnim = THREE.AnimationClip.findByName(fileAnimations, 'greeting');
        let greet = component.mixer.clipAction(greetAnim);
        greet.play();
      },
      (xhr) => {
        // called while loading is progressing
        console.log("loading the model");
      },
      (error) => {
        console.error(error);
      }
    );
  }

  private resizeRendererToDisplaySize(renderer: WebGLRenderer) {
    const canvas = renderer.domElement;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let canvasPixelWidth = canvas.width / window.devicePixelRatio;
    let canvasPixelHeight = canvas.height / window.devicePixelRatio;

    const needResize =
      canvasPixelWidth !== width || canvasPixelHeight !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  /**
   * checking whether our renderer is the same size as our canvas, 
   * as soon as it’s not, it returns needResize as a boolean.
   */
  private startRenderingLoop() {
    //* Renderer
    // Use canvas element in template
    let component: FigureShowComponent = this;
    (function render() {
      if (component.mixer) {
        component.mixer.update(component.clock.getDelta());
      }
      if (component.resizeRendererToDisplaySize(component.renderer)) {
        const canvas = component.renderer.domElement;
        component.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        component.camera.updateProjectionMatrix();
      }
      if (typeof component.model != "undefined") { //要判断是否undefined，因为有可能模型还没加载完
        component.model.visible = component.showModel;
      }
      requestAnimationFrame(render);
      component.sphereRotate(component);
      component.renderer.render(component.scene, component.camera);
    }());
  }

  sphereRotate(component: FigureShowComponent) {
    component.sphere.rotation.y += 0.01;
  }

  ngAfterViewInit(): void {
    this.setUpScene();
    this.loadModel();
    this.startRenderingLoop();
  }
}
