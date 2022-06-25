import { GameSceneComponent } from './../view/game-scene/game-scene.component';
import * as THREE from 'three';
import * as holdEvent from 'hold-event'
import { Action } from '../model/Player';

export const addKeyBoardControl = (sceneComponent: GameSceneComponent) => {
    const KEYCODE = {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40,
    };

    const enableDir = new Map([
        ['move left', true],
        ['move right', true],
        ['move forward', true],
        ['move backward', true],
        ['rotate left', true],
        ['rotate right', true],
        ['rotate upwards', true],
        ['rotate downwards', true]]);

    const collisionPrompt = new Map([
        ['move left', 'press \'←\' to move left'],
        ['move right', 'press \'→\' to move right'],
        ['move forward', 'press \'↑\' to move forward'],
        ['move backward', 'press \'↓\' to move backward'],
        ['rotate left', 'press \'D\' to rotate right'],
        ['rotate right', 'press \'A\' to grotate left'],
        ['rotate upwards', 'press \'S\' to rotate upward'],
        ['rotate downwards', 'press \'W\' to rotate downward']]);

    const enableAllDir = () => {
        enableDir.forEach((v, k) => {
            enableDir.set(k, true);
        })
    }

    /**
     * 禁用所有方向
     */
    const disableAllDirExcept = (exception: string) => {
        enableDir.forEach((v, k) => {
            enableDir.set(k, false);
        })
        enableDir.set(exception, true);
    }

    const refreshCameraSphere = () => {
        sceneComponent.world.cameraSphere.set(sceneComponent.world.control.camera.position, sceneComponent.world.cameraSphere.radius)
    }

    // 发生碰撞后设置标志 UI提示如何操作
    const showCollisionPrompt = () => {
        //提示碰撞后往哪边
        enableDir.forEach((v, k) => {
            if (v) {//enable
                sceneComponent.collisionPrompt = collisionPrompt.get(k)!
            }
        })
    }

    // 检测是否存在碰撞
    const existCollision = () => {
        for (let i = 0; i < sceneComponent.confine.length; i++) {
            if (sceneComponent.confine[i].intersectsSphere(sceneComponent.world.cameraSphere)) {
                console.log('collision', sceneComponent.confine[i], sceneComponent.world.cameraSphere)
                return true;
            }
        }
        return false;
    }

    // 平移
    const moveForward = (event: any) => {
        if (sceneComponent.inFloatMode //在悬浮模式下不能移动位置
            || !enableDir.get('move forward') // 这个方向因为碰撞被禁用了
        ) {
            return
        }

        // 没有被禁用：
        //1. 没有发生碰撞 
        //2. 碰撞了，但当前移动的方向是碰撞的反方向

        sceneComponent.world.myPlayerAction = Action.walking
        // 允许移动，要到下一帧才能看出这次移动的效果
        sceneComponent.world.control.forward(0.1 * event!['deltaTime'], true)
        refreshCameraSphere()
        console.log('前移相机球体中心：', sceneComponent.world.cameraSphere.center)

        const collisionAfterMove = existCollision()

        // 1.（上一帧移动完的结果）存在碰撞
        if (collisionAfterMove) {
            // 前移导致的碰撞，从不碰撞到碰撞
            if (enableDir.get('move backward') && enableDir.get('move forward')) {
                // 禁用其他方向移动，只允许反方向移动
                disableAllDirExcept('move backward')
            }
            // else的情况：为了摆脱后移导致的碰撞而前移，但是仍然碰撞，那么不修改什么
            showCollisionPrompt()
            sceneComponent.collisionOccur = true;
        }
        // 2. 前移解决了后移导致的碰撞
        else if (sceneComponent.collisionOccur && !collisionAfterMove) {
            enableAllDir()
            sceneComponent.collisionOccur = false;
        }
    }

    const moveBackward = (event: any) => {
        if (sceneComponent.inFloatMode //在悬浮模式下不能移动位置
            || !enableDir.get('move backward') // 这个方向因为碰撞被禁用了
        ) {
            return
        }
        sceneComponent.world.myPlayerAction = Action.walking
        sceneComponent.world.control.forward(-0.1 * event!['deltaTime'], true)
        refreshCameraSphere()

        const collisionAfterMove = existCollision()
        if (collisionAfterMove) {
            if (enableDir.get('move backward') && enableDir.get('move forward')) {
                disableAllDirExcept('move forward')
            }
            showCollisionPrompt()
            sceneComponent.collisionOccur = true;
        }
        else if (sceneComponent.collisionOccur && !collisionAfterMove) {
            enableAllDir()
            sceneComponent.collisionOccur = false;
        }
    }

    const moveRight = (event: any) => {
        if (sceneComponent.inFloatMode //在悬浮模式下不能移动位置
            || !enableDir.get('move right') // 这个方向因为碰撞被禁用了
        ) {
            return
        }
        sceneComponent.world.myPlayerAction = Action.walking
        sceneComponent.world.control.truck(0.1 * event!['deltaTime'], 0, true)
        refreshCameraSphere()

        const collisionAfterMove = existCollision()
        if (collisionAfterMove) {
            if (enableDir.get('move right') && enableDir.get('move left')) {
                disableAllDirExcept('move left')
            }
            showCollisionPrompt()
            sceneComponent.collisionOccur = true;
        }
        else if (sceneComponent.collisionOccur && !collisionAfterMove) {
            enableAllDir()
            sceneComponent.collisionOccur = false;
        }
    }

    const moveLeft = (event: any) => {
        if (sceneComponent.inFloatMode //在悬浮模式下不能移动位置
            || !enableDir.get('move left') // 这个方向因为碰撞被禁用了
        ) {
            return
        }
        sceneComponent.world.myPlayerAction = Action.walking
        sceneComponent.world.control.truck(-0.1 * event!['deltaTime'], 0, true)
        refreshCameraSphere()

        const collisionAfterMove = existCollision()
        if (collisionAfterMove) {
            if (enableDir.get('move right') && enableDir.get('move left')) {
                disableAllDirExcept('move right')
            }
            showCollisionPrompt()
            sceneComponent.collisionOccur = true;
        }
        else if (sceneComponent.collisionOccur && !collisionAfterMove) {
            enableAllDir()
            sceneComponent.collisionOccur = false;
        }
    }

    //旋转
    const rotationLeft = (event: any) => {
        if (sceneComponent.inFloatMode //在悬浮模式下不能移动位置
            || !enableDir.get('rotate left') // 这个方向因为碰撞被禁用了
        ) {
            return
        }
        sceneComponent.world.myPlayerAction = Action.walking
        sceneComponent.world.control.rotate(- 0.02 * THREE.MathUtils.DEG2RAD * event.deltaTime, 0, true)
        refreshCameraSphere()

        const collisionAfterMove = existCollision()
        if (collisionAfterMove) {
            if (enableDir.get('rotate right') && enableDir.get('rotate left')) {
                disableAllDirExcept('rotate right')
            }
            showCollisionPrompt()
            sceneComponent.collisionOccur = true;
        }
        else if (sceneComponent.collisionOccur && !collisionAfterMove) {
            enableAllDir()
            sceneComponent.collisionOccur = false;
        }
    }

    const rotationRight = (event: any) => {
        if (sceneComponent.inFloatMode //在悬浮模式下不能移动位置
            || !enableDir.get('rotate right') // 这个方向因为碰撞被禁用了
        ) {
            return
        }
        sceneComponent.world.myPlayerAction = Action.walking
        sceneComponent.world.control.rotate(0.02 * THREE.MathUtils.DEG2RAD * event.deltaTime, 0, true)
        refreshCameraSphere()

        const collisionAfterMove = existCollision()
        if (collisionAfterMove) {
            if (enableDir.get('rotate right') && enableDir.get('rotate left')) {
                disableAllDirExcept('rotate left')
            }
            showCollisionPrompt()
            sceneComponent.collisionOccur = true;
        }
        else if (sceneComponent.collisionOccur && !collisionAfterMove) {
            enableAllDir()
            sceneComponent.collisionOccur = false;
        }
    }

    const rotationDown = (event: any) => {
        if (sceneComponent.inFloatMode //在悬浮模式下不能移动位置
            || !enableDir.get('rotate downwards') // 这个方向因为碰撞被禁用了
        ) {
            return
        }
        sceneComponent.world.myPlayerAction = Action.walking
        sceneComponent.world.control.rotate(0, 0.02 * THREE.MathUtils.DEG2RAD * event.deltaTime, true)
        refreshCameraSphere()

        const collisionAfterMove = existCollision()
        if (collisionAfterMove) {
            if (enableDir.get('rotate downwards') && enableDir.get('rotate upwards')) {
                disableAllDirExcept('rotate upwards')
            }
            showCollisionPrompt()
            sceneComponent.collisionOccur = true;
        }
        else if (sceneComponent.collisionOccur && !collisionAfterMove) {
            enableAllDir()
            sceneComponent.collisionOccur = false;
        }
    }

    const rotationUp = (event: any) => {
        if (sceneComponent.inFloatMode //在悬浮模式下不能移动位置
            || !enableDir.get('rotate upwards') // 这个方向因为碰撞被禁用了
        ) {
            return
        }
        sceneComponent.world.myPlayerAction = Action.walking
        sceneComponent.world.control.rotate(0,- 0.02 * THREE.MathUtils.DEG2RAD * event.deltaTime, true)
        refreshCameraSphere()

        const collisionAfterMove = existCollision()
        if (collisionAfterMove) {
            if (enableDir.get('rotate downwards') && enableDir.get('rotate upwards')) {
                disableAllDirExcept('rotate downwards')
            }
            showCollisionPrompt()
            sceneComponent.collisionOccur = true;
        }
        else if (sceneComponent.collisionOccur && !collisionAfterMove) {
            enableAllDir()
            sceneComponent.collisionOccur = false;
        }
    }

    const wKey = new holdEvent.KeyboardKeyHold(KEYCODE.W, 16.666);
    const aKey = new holdEvent.KeyboardKeyHold(KEYCODE.A, 16.666);
    const sKey = new holdEvent.KeyboardKeyHold(KEYCODE.S, 16.666);
    const dKey = new holdEvent.KeyboardKeyHold(KEYCODE.D, 16.666);
    aKey.addEventListener('holding', rotationRight);
    dKey.addEventListener('holding', rotationLeft);
    wKey.addEventListener('holding', rotationDown);
    sKey.addEventListener('holding', rotationUp);

    const leftKey = new holdEvent.KeyboardKeyHold(KEYCODE.ARROW_LEFT, 100);
    const rightKey = new holdEvent.KeyboardKeyHold(KEYCODE.ARROW_RIGHT, 100);
    const upKey = new holdEvent.KeyboardKeyHold(KEYCODE.ARROW_UP, 100);
    const downKey = new holdEvent.KeyboardKeyHold(KEYCODE.ARROW_DOWN, 100);
    leftKey.addEventListener('holding', moveLeft);
    rightKey.addEventListener('holding', moveRight);
    upKey.addEventListener('holding', moveForward);
    downKey.addEventListener('holding', moveBackward);
}