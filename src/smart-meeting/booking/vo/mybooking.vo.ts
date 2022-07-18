/**
 * MyBookingVo
 */
export interface MyBookingVo {
    bookingId:string;
    buildingId: string;
    //大楼名称
    buName: string;
    floorId: string;
    //楼层名称
    flName: string;
    //区域名称
    areaName: string;
    userId: string;
    userName: string;
    spaceId: string;
    //会议室名称
    spaceName: string;
    //X 坐标
    dimensionX: string;
    //Y 坐标
    dimensionY: string;
    //会议人数
    seatingCapacity: string;
    //开始时间
    startTime: string;
    //结束时间
    endTime: string;
    //预约类型
    type: string;
    //会议状态
    state: string;
    moderator: string;
    topic: string;
    //用户时间开始时间
    useStartTime: string;
    //用户实际结束时间
    useEndTime: string,
}