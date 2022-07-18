export interface MessageVo {
    deskCode: string,
    date: string,
    startTime: string,
    endTime: string,
    //签到最大时间(minute)
    signTimes: number,
    //修改最大时间(minute)
    editTimes: number,
    //签到前提醒时间(minute)
    signBeforeTimes: number,
    //使用剩余时间(minute)
    useRemainTimes: number
}
