import { Body, Inject, Injectable, ValidationPipe } from '@nestjs/common';
import * as moment from 'moment';
import { EntityManager } from 'typeorm';
import { MgOperationDto } from './mg-operation.dto';
import { MgOperationEntity } from '../model/mg-operation.entity';

@Injectable()
export class MgOperationService {

    @Inject()
    private readonly conn: EntityManager;
    async save(@Body(new ValidationPipe()) operationDto: MgOperationDto) {
        const operation = new MgOperationEntity();
        const nowStr = moment().format('YYYY-MM-DD HH:mm:ss');
        operation.userId = operationDto.userId;
        operation.comment = operationDto.comment;
        operation.updateTime = nowStr;
        operation.createTime = nowStr;
        operation.type = operationDto.type;
        return await this.conn.getRepository(MgOperationEntity).insert(operation);
    }
 }
