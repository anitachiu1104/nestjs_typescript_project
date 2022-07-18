import { Inject, Injectable } from '@nestjs/common';
import { SysFloorEntity } from '../model/sys-floor.entity';
import { EntityManager } from 'typeorm';
import { SysBuildEntity } from '../model/sys-build.entity';
import { BuildingVo } from './vo/building.vo';
import { FloorVo } from './vo/floor.vo';
import { RegionVo } from './vo/region.vo';
import { SysAreaEntity } from '../model/sys-area.entity';
import { MgDepartEntity } from '../model/mg-depart.entity';
import { UserLocationVo } from './vo/user-location.vo';
import { StaffEntity } from '../model/staff.entity';

@Injectable()
export class BuildingService {
    @Inject()
    private readonly conn: EntityManager;

    async getLocationByUserId(userId: number): Promise<UserLocationVo> {
        return await this.conn
          .getRepository(StaffEntity)
          .createQueryBuilder('s')
          .innerJoin(MgDepartEntity, 'd', 's.depart_id=d.de_id')
          .select('s.depart_id', 'departId')
          .addSelect('d.bu_id', 'buildingId')
          .addSelect('d.fl_id', 'floorId')
          .where('s.st_id=:userId', { userId })
          .getRawOne<UserLocationVo>();
    }

    async findBuildingById(id: number) {
        return await this.conn.getRepository(SysBuildEntity).findOne(id);
    }

    async findBuilds(): Promise<BuildingVo[]> {
        return await this.conn.getRepository(SysBuildEntity).createQueryBuilder()
            .select('bu_id', 'buId')
            .addSelect('bu_name', 'buName')
            .addSelect('bu_allday', 'buAllday')
            .getRawMany<BuildingVo>();
    }

    /**
     * Pad查询大楼列表
     */
    async padFindBuilds(): Promise<BuildingVo[]> {
        return await this.conn.getRepository(SysBuildEntity).createQueryBuilder()
            .select('bu_id', 'buId')
            .addSelect('bu_name', 'buName')
            .addSelect('bu_allday', 'buAllday')
            .getRawMany<BuildingVo>();
    }

    async findFloorsByBuId(buId: number): Promise<FloorVo[]> {
        return await this.conn.getRepository(SysFloorEntity).createQueryBuilder()
        .select('fl_id', 'flId')
        .addSelect('fl_name', 'flName')
        .where('bu_id=:buId', { buId })
        .getRawMany<FloorVo>();
    }

    async findRegionsByFlId(flId: number): Promise<RegionVo[]> {
        return await this.conn.getRepository(SysAreaEntity).createQueryBuilder()
        .select('id', 'rid')
        .addSelect('name', 'rName')
        .where('fl_id=:flId', { flId })
        .getRawMany<RegionVo>();
    }

    public async findAllDeps(buId: number): Promise<MgDepartEntity[]>{
        let queryBuilder = await this.conn.getRepository(MgDepartEntity).createQueryBuilder();
        queryBuilder.where('is_delete = 0').andWhere('parent_id <> 0');
        if (buId){
            queryBuilder.andWhere('bu_id = :buId',{buId});
        }
        return queryBuilder.getMany();
    }
}

