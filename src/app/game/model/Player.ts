import { World } from './World';
import { NewUserData } from '../../models/newUserData';
import * as THREE from "three"
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export const loadPlayerModel = (world: World, player: NewUserData) => {
  const loader = new GLTFLoader();
  let model;
  console.log('in load player model:', player)

  loader.load(
    "../../../assets/player_3d_model/model" + player.portrait.portraitId + ".glb",
    (gltf) => {
      model = gltf.scene;
      model.visible = false; //还没有位置信息
      model.traverse(o => {
        if ((<THREE.Mesh>o).isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          // 取消view frustum culling， 让部分出现在相机视野内的物体也被渲染
          o.frustumCulled = false;
        }
      });
      model.animations = gltf.animations;
      model.scale.set(98, 98, 98);

      /* 在2d平面上增加每个玩家的用户名标签 */
      world.scene.add(model)
      const usernameDiv = createLabelDiv(player.username)
      const usernameLabel = new CSS2DObject(usernameDiv);
      world.usernameLabelMap.set(player.socketId, usernameDiv)
      usernameLabel.position.set(0, 1.5, 0);
      model.add(usernameLabel);

      // 在world的map中储存数据
      world.playerMap.set(player.socketId, model)

      // 储存动画播放器,每个玩家一个
      const mixer = new THREE.AnimationMixer(model);
      world.playerAnimationMap.set(player.socketId, mixer);
    },
    (xhr) => {
    },
    (error) => {
      console.error(error);
    }
  );
}

const createLabelDiv=(username:string)=>{
  let div = document.createElement('div');
  div.className = 'text-label';
  div.style.width = 'max-content';
  div.style.height = 'fit-content';
  div.style.color = 'gainsboro';
  div.style.zIndex = '100'
  div.style.fontSize = '16px'
  div.style.fontFamily = 'monospace'
  div.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
  div.style.padding = '10px 20px'
  div.style.borderRadius = '30px'
  div.style.marginTop = '-1em';
  div.textContent = username;
  return div;
}

//枚举类型，ui8
export enum Action {
  walking = "walking",
  idle = "idle",
  greeting = "greeting"
}