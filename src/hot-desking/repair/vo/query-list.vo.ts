import { IsNumber } from 'class-validator';
import { PageInterface } from './../../../core/page/page.interface';

export class QueryListVo {
    @IsNumber()
    uid: number;
    page: PageInterface;
}