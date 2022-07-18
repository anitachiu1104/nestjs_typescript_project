/**
 *  MgSpaceVo
 */
export interface MgSpaceVo {
    spaceId: number;
    //会议室Code
    positionName: string;
    //会议室类型
    category: string;
    //X坐标
    dimensionX: string;
    //Y坐标
    dimensionY: string;
    //大厦Id
    buId: string;
    //大厦名称
    buName: string;
    //楼层Id
    flId: string;
    //楼层Id
    flName: string;
}