import { Component, OnInit, ElementRef, Input, ViewChild, AfterViewInit } from '@angular/core';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Router } from '@angular/router';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit, AfterViewInit {

  @ViewChild('canvas')
  private canvasRef!: ElementRef;

  //* Cube Properties

  @Input() public rotationSpeedX: number = 0.01;

  @Input() public rotationSpeedY: number = 0.005;

  @Input() public size: number = 200;

  @Input() public texture: string = "/assets/texture.jpeg";

  //* Stage Properties

  @Input() public cameraZ: number = 30;

  @Input() public fieldOfView: number = 75;

  @Input('nearClipping') public nearClippingPlane: number = 0.1;
  
  @Input('farClipping') public farClippingPlane: number = 1000;

  //? Helper Properties (Private Properties);

  private camera!: THREE.PerspectiveCamera;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  private loader = new THREE.TextureLoader();
  private geometry = new THREE.IcosahedronGeometry(4);
  // private material = new THREE.MeshBasicMaterial({ map: this.loader.load(this.texture) });
  private material = new THREE.MeshStandardMaterial({ color: 0xF5F5DC, wireframe: true });

  private pointLight = new THREE.PointLight(0xffffff);
  private ambientLight = new THREE.AmbientLight(0xffffff);
  private lightHelper = new THREE.PointLightHelper(this.pointLight);

  private torusKnot: THREE.Mesh = new THREE.Mesh(this.geometry, this.material);

  private renderer!: THREE.WebGLRenderer;

  private scene!: THREE.Scene;

  private orbitsControl !: OrbitControls;
  /**
   *Animate the cube
   *
   * @private
   * @memberof HomepageComponent
   */
  private animateCube() {
    this.torusKnot.rotation.x += this.rotationSpeedX;
    this.torusKnot.rotation.y += this.rotationSpeedY;
    this.torusKnot.rotation.z += 0.01;
    this.camera.rotation.x += 0.01;
    this.camera.position.y += 0.01;
    this.camera.position.z += 0.01;
    this.orbitsControl.update();
  }

  private addStar() {
    const geometry = new THREE.SphereGeometry(0.25, 24, 24);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const star = new THREE.Mesh(geometry, material);

    star.position.set(THREE.MathUtils.randFloatSpread(100), THREE.MathUtils.randFloatSpread(100), THREE.MathUtils.randFloatSpread(100));
    this.scene.add(star);
  }

  /**
   * Create the scene
   *
   * @private
   * @memberof HomepageComponent
   */
  private createScene() {
    //* Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000)
    this.scene.add(this.torusKnot);
    //*Camera
    let aspectRatio = this.getAspectRatio();
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      aspectRatio,
      this.nearClippingPlane,
      this.farClippingPlane
    )
    this.camera.position.z = this.cameraZ;
    this.pointLight.position.set(20, 20, 20);
    this.scene.add(this.pointLight, this.ambientLight);
    for (let index = 0; index < 200; index++) {
      this.addStar();
    }
  }

  private getAspectRatio() {
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  /**
 * Start the rendering loop
 *
 * @private
 * @memberof HomepageComponent
 */
  private startRenderingLoop() {
    //* Renderer
    // Use canvas element in template
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.orbitsControl = new OrbitControls(this.camera, this.renderer.domElement);

    let component: HomepageComponent = this;
    (function render() {
      requestAnimationFrame(render);
      component.animateCube();
      component.renderer.render(component.scene, component.camera);
    }());
  }

  constructor(private router: Router) { }
  
  ngAfterViewInit(): void {
    this.createScene();
    this.startRenderingLoop();
  }

  ngOnInit(): void { }

  toLogin() {
    this.router.navigateByUrl('login');
  }

  toRegister() {
    this.router.navigateByUrl('register');
  }
}