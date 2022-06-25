import { NPC_INSTRUCT } from './../view/game-npc/npcCheckpointId';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GameSceneComponent } from './../view/game-scene/game-scene.component';

/**
   * 加载房间模型
   */
export const loadRoomModel = (component: GameSceneComponent) => {
  const loader = new GLTFLoader();
  const size = 56025864;
  loader.load(
    component.ROOM_MODEL_PATH,
    (gltf) => {
      component.roomModel = gltf.scene;
      component.roomModel.traverse(o => {
        if ((<THREE.Mesh>o).isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          //默认隐藏的物体，比如说叉子里的纸条
          if (o.userData['defaultHide'] == 0) {
            o.visible = false
          }
        }

        // 如果有动画，把blender动画导入给three的object3d
        if (o.userData['animation']) {
          o.animations = [gltf.animations.find(item => item.name == o.userData['animation'])!]
        }
      });

      component.roomModel.name = 'room';
      component.world.scene.add(component.roomModel);
      component.world.objectMixer = new THREE.AnimationMixer(component.world.scene)

      // 用AABB给room里的所有物件加上box来检测碰撞
      component.world.scene.getObjectByName('room')?.children.forEach((o) => {
        const box3 = new THREE.Box3().setFromObject(o)
        // console.log(o.name,box3.min,box3.max)
        // component.world.scene.add(new THREE.Box3Helper(box3))
        if(o.userData['closeCheck']!=undefined){
          console.log('box',o.name,box3)
        }
        component.confine.push(box3)
      })

      // 用camera-controls进行检测碰撞，问题是自由度不大高，性能不大好，还是自己来写吧
      component.world.control.colliderMeshes = component.world.scene.getObjectByName('room')?.children!

      // 加载完成，其他东西可以去掉了
      component.loading = false;
      component.stopLoader()
      component.showNpc = true;
      component.npcCheckpointId = NPC_INSTRUCT;//开始引导
    },
    (xhr) => {
      console.log(`loading room model ${xhr.loaded / size * 100}`);
      component.loadProgress = xhr.loaded / size * 100
     },
    (error) => {
      console.error(error);
    }
  );
}