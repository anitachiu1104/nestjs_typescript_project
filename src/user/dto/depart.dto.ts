import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { PageInterface } from '../../core/page/page.interface';

export class DepartDto {
    @IsNumber()
    @IsNotEmpty()
    departId: number;
    @IsNotEmpty()
    page: PageInterface
}
