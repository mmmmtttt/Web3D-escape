import { Component, OnInit, ElementRef, Input, ViewChild, AfterViewInit } from '@angular/core';
import * as THREE from "three";

@Component({
  selector: 'app-background-star',
  templateUrl: './background-star.component.html',
  styleUrls: ['./background-star.component.css']
})
export class BackgroundStarComponent implements OnInit, AfterViewInit {

  @ViewChild('canvas')
  private canvasRef!: ElementRef;

  //* Stage Properties
  @Input() public fieldOfView: number = 75;

  @Input('nearClipping') public nearClippingPlane: number = 0.1;
  
  @Input('farClipping') public farClippingPlane: number = 1000;

  //? Helper Properties (Private Properties);

  private camera!: THREE.PerspectiveCamera;
  private particleMesh!:THREE.Points;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }
  private pointLight = new THREE.PointLight(0xffffff,0.1);
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;

  /**
   * Create the scene
   *
   * @private
   * @memberof HomepageComponent
   */
  private createScene() {
    //* Scene
    this.scene = new THREE.Scene();
    this.scene.background = null; //背景透明
    
    //*Camera
    let aspectRatio = this.getAspectRatio();
    this.camera = new THREE.PerspectiveCamera(
      this.fieldOfView,
      aspectRatio,
      this.nearClippingPlane,
      this.farClippingPlane
    )
    this.camera.position.z = 2;
    this.pointLight.position.set(2,3,4);

    const particleGeometry = new THREE.BufferGeometry;
    const particleCount = 1000;
  
    const posArray = new Float32Array(particleCount *3)
    for(let i = 0;i<particleCount*3;i++){
      posArray[i] = (Math.random()-0.5)*(Math.random()*5)
    }

    const material = new THREE.PointsMaterial({
      size:0.005
    })
    particleGeometry.setAttribute('position',new THREE.BufferAttribute(posArray,3))
    this.particleMesh = new THREE.Points(particleGeometry,material)

    this.scene.add(this.pointLight);
    this.scene.add(this.particleMesh)
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
    this.renderer.setClearColor(0x000000, 0); //背景透明
    this.renderer.setPixelRatio(devicePixelRatio);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);

    let component: BackgroundStarComponent = this;
    (function render() {
      requestAnimationFrame(render);
      component.particleMesh.rotation.y+=0.001;
      component.renderer.render(component.scene, component.camera);
    }());
  }
  
  ngAfterViewInit(): void {
    this.createScene();
    this.startRenderingLoop();
  }

  ngOnInit(): void { }
}