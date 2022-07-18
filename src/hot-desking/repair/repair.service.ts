import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageResultInterface } from './../../core/page/page-result.interface';
import { PageHelper } from './../../core/page/page.helper';
import { MgRepairDetailEntity } from './../../model/mg-repair-detail.entity';
import { MgRepairEntity } from './../../model/mg-repair.entity';
import { MgSpaceEntity } from './../../model/mg-space.entity';
import { RepairDto } from './dto/repair.dto';
import { QueryListVo } from './vo/query-list.vo';
import * as moment from 'moment';
import {SaveDto} from "./vo/save.dto";
import {ConfigService} from "../../core/config/config.service";
import * as path from "path";
import {v4 as uuidv4} from "uuid";
import { FileUtil } from '../../core/util/file.util';
import * as _ from "lodash";
import { SysBuildEntity } from '../../model/sys-build.entity';
import { SysFloorEntity } from '../../model/sys-floor.entity';


@Injectable()
export class RepairService {
    @Inject()
    private readonly conn: EntityManager;
    @Inject()
    private configService: ConfigService;

    async findRepairs(queryDto: QueryListVo): Promise<PageResultInterface<RepairDto>> {
        const total = await this.conn
            .getRepository(MgRepairDetailEntity)
            .createQueryBuilder()
            .where('user_id=:uid', { uid: queryDto.uid })
            .getCount();

        const data = await this.conn
            .getRepository(MgRepairDetailEntity)
            .createQueryBuilder('r')
            .select('(select code from mg_space where id=r.space_id)', 'spaceCode')
            .addSelect('(select t2.bu_name from mg_space t1 left join sys_build t2 on t1.building_id = t2.bu_id where t1.id=`r`.`space_id`)','buName')
            .addSelect('(select t4.fl_name from mg_space t3 left join sys_floor t4 on t3.floor_id = t4.fl_id  where t3.id=`r`.`space_id`)','flName')
            .addSelect('r.create_time', 'createTime')
            .addSelect('r.type', 'type')
            .addSelect(`case r.state when 1 then '待修复' when 2 then '已修复' end as state`)
            .where('r.user_id=:uid', { uid: queryDto.uid })
            .orderBy('r.create_time', 'DESC')
            .skip(PageHelper.getSkip(queryDto.page))
            .take(queryDto.page.pageSize)
            .getRawMany<RepairDto>();

        return {
            total,
            data
        };
    }
    async saveRepairs(files,saveDto:SaveDto): Promise<void>{
        //上传文件

        const destPath = (this.configService.get('FILE_UPLOAD_PATH') || '/home/wism/temp') + path.sep+'repair';
        let destFullPath = '';
        for (let file of files){
            let originalFileName = uuidv4() + '.jpg';
            let destFullPathOne = path.join(destPath,originalFileName);
            if (destFullPath)destFullPath+=',';
            destFullPath += destFullPathOne;
            await FileUtil.uploadOneFile(destFullPathOne,file.buffer,destPath);
        }


        return await this.conn.transaction(async() =>{
            //查询工位代号是否有记录
            let result = await this.conn.getRepository(MgSpaceEntity).createQueryBuilder()
                .select('id').where('code = :code',{code:saveDto.spaceCode})
                .getRawOne();
            if (_.size(result)<1) return Promise.reject('工位代号不存在');
            let spaceId = _.get(result,'id')
            //插入表头
            const nowStr = moment().format('YYYY-MM-DD HH:mm:ss');
            let newRepair = await this.conn.getRepository(MgRepairEntity).save(
                {
                    spaceId,
                    proofPath: destFullPath,
                    comment: saveDto.comment,
                    userId: saveDto.userId,
                    createTime: nowStr,
                    updateTime: nowStr,
                    create_by: saveDto.userId,
                    is_delete: 0
                }
            );
            // query(`insert into mg_repair(space_id,proof_path,comment,user_id,create_time,update_time)
            // values (?,?,?,?,?,?)`, [spaceId,destFullPath,saveDto.comment,saveDto.userId,nowStr,nowStr]);
            //插入明细
            let replacements = [];
            let types = saveDto.types.split(',');
            for(let type of types){
                replacements.push({pid: newRepair.id,spaceId: spaceId,equipmentCode:'',type,state:1,createTime:nowStr
                    ,updateTime:nowStr,userId:saveDto.userId,createBy: '',isDelete: 0,comment: saveDto.comment,proofPath:destFullPath })
            }
            await this.conn.getRepository(MgRepairDetailEntity).createQueryBuilder().insert().values(replacements).execute();
            //     .query(`insert into mg_repair_detail(pid,space_id,user_id,create_time,update_time,type,state)
            // values ${values}`, replacements);
        })


    }
}
