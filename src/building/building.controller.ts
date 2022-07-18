import { Body, Controller, Get, Inject, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BuildingService } from './building.service';
import { BuildingVo } from './vo/building.vo';
import { FloorVo } from './vo/floor.vo';
import { RegionVo } from './vo/region.vo';
import { departVo } from '../user/vo/depart.vo';
import { UserLocationVo } from './vo/user-location.vo';

@Controller('/building')
export class BuildingController {
    @Inject()
    private readonly buildingService: BuildingService;

    @UseGuards(JwtAuthGuard)
    @Get('/myLocation')
    async getMyLocation(@Request() req): Promise<UserLocationVo> {
        return await this.buildingService.getLocationByUserId(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/:buildingId')
    async findBuildingById(@Param('buildingId') id: number) {
        return this.buildingService.findBuildingById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/')
    async findBuilds(): Promise<BuildingVo[]> {
        return await this.buildingService.findBuilds();
    }

    @Get('/pad/building')
    async padFindBuilds(): Promise<BuildingVo[]> {
        return await this.buildingService.padFindBuilds();
    }

    @UseGuards(JwtAuthGuard)
    @Get('/:buId/floors')
    async findFloorsByBuId(@Param('buId') buId: number): Promise<FloorVo[]> {
        return await this.buildingService.findFloorsByBuId(buId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('/floor/:flId/regions')
    async findRegionsByFlId(@Param('flId') flId: number): Promise<RegionVo[]> {
        return await this.buildingService.findRegionsByFlId(flId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('/getDeparts')
    public async getDeparts(@Body('buId')buId:number): Promise<departVo[]>{
        return await this.buildingService.findAllDeps(buId);
    }
    @Post('/pad/getDeparts')
    public async getDepartsPad(@Body('buId')buId:number): Promise<departVo[]>{
        return await this.buildingService.findAllDeps(buId);
    }

}
