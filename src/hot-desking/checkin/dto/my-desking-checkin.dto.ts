/**
 * 签到预定记录
 */
export interface MyDeskingCheckinDto {
    //用户userId
    userId: number,
    //大楼Id
    buId: number,
    //楼层Id
    flId:number,
    //空间Id
    areaId: number,
    //结束时间周期
    timeType: number,
    //预定方式
    type: string,
    //预定类型
    type2: string,
}