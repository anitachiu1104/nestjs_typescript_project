import {PageInterface} from "../../../core/page/page.interface";
import { IsNumber, IsString } from 'class-validator';
export class MyBookingDto {
    @IsNumber()
    userId:number;
    buId:number;
    flId:number;
    areaId:number;
    timeType:number;
    type:string;
    type2:string;
    page: PageInterface;
}
