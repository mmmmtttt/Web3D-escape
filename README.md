# EscapeFrontend

## 1.游戏逻辑介绍

### 我们的实现：两个场景，三个模式
#### 场景：
代码中有两套完整的Threejs的场景布置，即THREE.Scene + Camera + Controls (用来自动更新Camera)，两个场景共用renderer和canvas，相当于在canvas上渲染两层
- 主场景
- 次场景：透明的场景，只有当前在交互的物体（可以透过次场景看到主场景）
#### 模式
玩家眼里的游戏看起来的模式，比如全景模式，检查某个物体的模式...
- 全景模式 fullViewMode
- 检查模式 checkMode : 相机去凑近物体，类比玩家上前仔细观摩
- 悬浮模式 floatMode : 相机不动，物体凑近，类比玩家全身心focus在和物体交互
#### 它们之间的关系
1. 主场景：全景模式和检查模式都在主场景，只是主场景的相机切换位置
2. 次场景：悬浮模式从主场景进入次场景（严格来说不算进入，只是把主场景的相机位置和focus的物体的位置克隆到透明的次场景，然后玩家在次场景和物体进行交互）

### userData
在blender中给模型中的物体加上自定义的属性，用three.js导入，会把它们包装成属性的对象，用object.userData获得

目前定义的有：
- floatNear (int:只用判断这个属性是否存在) 可以进入悬浮模式交互
- checkClose (int) 可以进入检查模式
- selectGroup (string:组名字) 选中它会自动选中一个组的物体
- unselectable (int) 不可以选中的物体，比如墙
- liftUp (int) 在主场景中选中它会让他抬起来
- defaultHide (int) 默认隐藏的物体，只有在玩家在悬浮模式下发现了其他线索才会让其显现
- show (string:物体名字) 玩家点击它会显示其他的物品
- hide (string:物体名字) 玩家点击它会隐藏其他的物品

## 2.用到的一些东东
- Angular 13.3.0
- Bootstrap css：用grid方便css
- Angular material：UI组件
- alertyfyjs：代替windows.alert展示错误
- gsap: 超炫酷的动画
- socket.io: 实时聊天（⚠️ 2.3.0，非最新版本）
- bitecs: 组织储存游戏数据

## 3.组件
- home: scroll主页
- ~~video-homepage : 背景是视频播放的主页~~
- ~~homepage：背景是3d的主页~~
- login：登陆（jo）
- register：注册
- figure-show: 展示单个虚拟形象的组件
- figure-card: 在注册时第二步选择虚拟形象时展示的头像卡片
- figure-selector：将所以模型的卡片集中展示的组件

## 4.项目代码风格
- 错误统一处理：在errors.interceptor中对http请求的错误统一处理，用alertifyjs来提示错误（本项目中将它封装成了service）
- 服务的抽取：components中只负责数据的展示，处理（对后端的请求）放在service里

## 5.我们前端如果要测试的话
- cd FakeServer 
- node server.js
- 如果要测试websocket,打开nginx，反向代理
- 打开webSocket demo的backend，跑起来
- ng serve，去localhost:4200
```
web3d-escape-game
├─ src
│  ├─ app
│  │  ├─ app-routing.module.ts
│  │  ├─ app.component.css
│  │  ├─ app.component.html
│  │  ├─ app.component.ts
│  │  ├─ app.module.ts
│  │  ├─ components
│  │  │  ├─ background-star
│  │  │  ├─ chat
│  │  │  ├─ figure-card
│  │  │  ├─ figure-selector
│  │  │  ├─ figure-show
│  │  │  ├─ game-introduction
│  │  │  ├─ room-card
│  │  │  └─ tool-bar
│  │  ├─ game
│  │  │  ├─ model
│  │  │  │  ├─ Player.ts
│  │  │  │  ├─ Room.ts
│  │  │  │  └─ World.ts
│  │  │  ├─ utils
│  │  │  │  ├─ KeyBoardControls.ts
│  │  │  │  └─ utils.ts
│  │  │  └─ view
│  │  │     ├─ answer-result
│  │  │     ├─ game
│  │  │     ├─ game-guide
│  │  │     ├─ game-npc
│  │  │     ├─ game-scene
│  │  │     ├─ item-column
│  │  │     ├─ loading
│  │  │     ├─ mouse-guide
│  │  │     └─ npc-button
│  │  ├─ guards
│  │  │  └─ auth.guard.ts
│  │  ├─ interceptors
│  │  │  ├─ auth.interceptor.ts
│  │  │  └─ errors.interceptor.ts
│  │  ├─ models
│  │  │  ├─ answerResult.ts
│  │  │  ├─ behaviorData.ts
│  │  │  ├─ chatMessage.ts
│  │  │  ├─ checkpointState.ts
│  │  │  ├─ clue.ts
│  │  │  ├─ delUserData.ts
│  │  │  ├─ historyRecord.ts
│  │  │  ├─ newUserData.ts
│  │  │  ├─ npc-dialogue
│  │  │  │  └─ room1.ts
│  │  │  ├─ portrait.ts
│  │  │  ├─ position.ts
│  │  │  ├─ profileDetail.ts
│  │  │  ├─ roomInfo.ts
│  │  │  ├─ tryAnswer.ts
│  │  │  └─ VictoryData.ts
│  │  ├─ pages
│  │  │  ├─ home
│  │  │  ├─ homepage
│  │  │  ├─ login
│  │  │  ├─ profile
│  │  │  ├─ register
│  │  │  ├─ room-selector
│  │  │  └─ video-homepage
│  │  ├─ route-animation.ts
│  │  └─ services
│  │     ├─ alertify.service.ts
│  │     ├─ app-config.service.ts
│  │     ├─ auth.service.ts
│  │     ├─ chat.service.ts
│  │     ├─ game-sync.service.ts
│  │     ├─ room-select.service.ts
│  │     └─ websocket.service.ts
│  ├─ assets
│  │  ├─ badge
│  │  ├─ bgm
│  │  ├─ config
│  │  ├─ homepage
│  │  ├─ loading
│  │  ├─ npc_3d_model
│  │  ├─ player_3d_model
│  │  ├─ player_thumbnail
│  │  ├─ room_3d_model
│  │  ├─ room_assets
│  │  ├─ room_clues
│  │  └─ room_information

```