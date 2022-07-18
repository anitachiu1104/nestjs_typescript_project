export interface PositionVo {
    //大楼Id
    buId:string;
    //楼层Id
    flId:string;
    //会议室Id
    spaceId:string;
    //审核类型
    auditStatus:string;
    //会议室名称
    positionName: string;
    //X 坐标
    dimensionX: number;
    //Y 坐标
    dimensionY: number;
    //宽
    width: number ;
    //高
    height: number;
    //会议室容量
    seatingCapacity: string;
    //设备
    equipmentName: string;
    //大厦名称
    buName:string;
    //楼层名称
    flName:string;
    //会议室状态
    state:string;
}