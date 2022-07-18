import { Body, Controller, Inject, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RepairService } from '../repair/repair.service';
import { SaveDto } from '../repair/dto/save.dto';

@Controller()
export class RepairController {
    @Inject()
    private readonly repairService: RepairService;

    //设备上传报修W
    //@UseGuards(JwtAuthGuard)
    @Post('/equipment/repair/save')
    async equipmentRepairSave(@Body() saveDto: SaveDto): Promise<void> {
        console.log(saveDto.spaceCode+saveDto.comment+saveDto.types+saveDto.userId);
        return await this.repairService.equipmentRepairSave(saveDto);
    }

}