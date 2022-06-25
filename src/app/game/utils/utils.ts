import * as THREE from 'three'

const checkpointName = ['CACHE','CONTROL UNIT','TCP BIT','VIRGINIA CRYTO','HASH TABLE','RIDDLE','MUSIC CRYPTO','FINAL ESCAPE']

export const getCameraLookDir = (camera: THREE.PerspectiveCamera) => {
    var vector = new THREE.Vector3(0, 0, -1);
    vector.applyQuaternion(camera.quaternion);
    return vector;
}

export const getCheckpointName = (id:number) =>{
  return checkpointName[id]
}

export const getPlayerUsername = (socketId: number,usernameMap:any)=>{
  // 是别的玩家
  if (usernameMap.has(socketId)) {
    return usernameMap.get(socketId).textContent;
  }
  return '';
}