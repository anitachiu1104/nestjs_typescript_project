import { Inject, Injectable } from '@nestjs/common';
import { SaveDto } from './dto/save.dto';
import { EntityManager } from 'typeorm';
import { ConfigService } from '../../core/config/config.service';
import { MgSpaceEntity } from '../../model/mg-space.entity';
import * as _ from 'lodash';
import * as moment from 'moment';
import { MgRepairEntity } from '../../model/mg-repair.entity';
import { MgRepairDetailEntity } from '../../model/mg-repair-detail.entity';

@Injectable()
export class RepairService {

    @Inject()
    private readonly conn: EntityManager;
    @Inject()
    private configService: ConfigService;

    /**
     * 新增设备报修
     * @param saveDto
     */
    public async equipmentRepairSave(saveDto: SaveDto):Promise<void>{
        //查询工位是否存在
        const resultSpaceId = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder()
            .select('id','spaceId')
            .where('code =:code',{ code:saveDto.spaceCode })
            .getRawOne();
        const spaceId = resultSpaceId.spaceId;
        if(resultSpaceId === null){
            return Promise.reject('工位代号不存在');
        }else{
            return await this.conn.transaction(async ()=>{
                //插入报修主表
                const nowStr = moment().format('YYYY-MM-DD HH:mm:ss');
                let newRepair = await this.conn.getRepository(MgRepairEntity).save(
                    {
                        spaceId,
                        comment: saveDto.comment,
                        userId: saveDto.userId,
                        createTime: nowStr,
                        updateTime: nowStr,
                        create_by: saveDto.userId,
                        is_delete: 0
                    }
                );
                //插入报修明细表
                let replacements = [];
                let types = saveDto.types.split(',');
                for(let type of types){
                    replacements.push({pid: newRepair.id,spaceId: spaceId,equipmentCode:'',type,state:1,createTime:nowStr
                        ,updateTime:nowStr,userId:saveDto.userId,createBy: '',isDelete: 0,comment: saveDto.comment})
                }
                await this.conn.getRepository(MgRepairDetailEntity).createQueryBuilder().insert().values(replacements).execute();

            })
        }
    }
}