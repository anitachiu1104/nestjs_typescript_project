/**
 *  会议室详情
 */
export interface MeetingDetailsVo {
    buId:string;
    flId:string;
    //大楼名称
    buName: string;
    //楼层名称
    flName: string;
    spaceId:number;
    //会议室名称
    spaceName:string;
    //会议容纳人数
    seatingCapacity: string;
    //会议主题
    topic: string;
    //会议室审核状态
    auditStatus: string;
    //会议室签到类型
    checkInType: string;
    //管理员
    adminName: string;
    //设备名称
    equipmentName: any;
}