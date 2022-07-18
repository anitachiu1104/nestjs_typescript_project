import { Body, Controller, Inject, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PageResultInterface } from 'src/core/page/page-result.interface';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RepairDto } from './dto/repair.dto';
import { RepairService } from './repair.service';
import { QueryListVo } from './vo/query-list.vo';
import { SaveDto } from './vo/save.dto';

@Controller()
export class RepairController {
    @Inject()
    private readonly repairService: RepairService;
    
    @UseGuards(JwtAuthGuard)
    @Post('/repair/list')
    async findRepairs(@Body() queryVo: QueryListVo): Promise<PageResultInterface<RepairDto>> {
        console.log('123');
        console.log(queryVo.uid);
        console.log(queryVo.page);
        return await this.repairService.findRepairs(queryVo);
    }
    //上传报修
    @UseGuards(JwtAuthGuard)
    @Post('/repair/save')
    @UseInterceptors(FilesInterceptor('files'))
    async save(@UploadedFiles() files ,@Body() saveDto: SaveDto): Promise<string> {
        await this.repairService.saveRepairs(files,saveDto);
        return 'upload success';
    }

}