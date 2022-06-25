/*一个封装了缩略图和对应的3d模型路径的类 */
export class ModelThumbnail {
    public idx: number;
    public imageUrl:string;
    public modelPath:string;
    public selected:boolean;//是否是被选中的那个模型
    constructor(idx:number,selected:boolean){
      this.selected = selected;
      this.idx = idx;
      this.imageUrl = `../../../assets/player_thumbnail/thumbnail${idx}.png`;
      this.modelPath=`../../../assets/player_3d_model/model${idx}.glb`;
    }
  }