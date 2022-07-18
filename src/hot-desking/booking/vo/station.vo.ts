import { StationDetailVo } from "./station-detail.vo";

export interface StationVo {
    spaceId: number;
    positionName: string;
    state: string;
    x: number;
    y: number;
    width: number;
    height: number;
    degree: number;
    stationDetails: StationDetailVo[];
}