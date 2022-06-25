export interface Clue{
    id:number,
    nameInModel:string, //在blender里设置的模型中的name
    nameToShow:string, //展示在用户界面上的名字
    type:ClueType,
    [key:string]:string|number, //动态增加键
}

//线索（关卡）的类型
export enum ClueType{
    answer,
    select
}