import { ScheduleContext, ScheduleDecorator, ScheduleProvider } from '../../schedule/schedule.decorator';
import { StaffEntity } from '../../model/staff.entity';
import { UserDto } from './dto/user.dto';
import { DepartDto } from './dto/depart.dto';
import { MgDepartEntity } from '../../model/mg-depart.entity';
import * as moment from 'moment';

@ScheduleDecorator({ name: 'hot-desking.user.find', cron: '0 0/3 * * * ?' })
export class FindUsersTask implements ScheduleProvider {
    async handle(data: object | string, context: ScheduleContext): Promise<string> {
        console.debug('running wism_wechatwork.user.sync');
        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        const departDtoList: DepartDto[] = await context.client.send({
            cmd: 'wism_wechatwork.department.sync',
        }, 'hot-desking').toPromise();

        context.logger.debug(JSON.stringify(departDtoList));

        const newDeparts = [];
        for (const depart of departDtoList) {
            const row = await context.conn
                .getRepository(MgDepartEntity)
                .createQueryBuilder()
                .where('de_id=:id', { id: depart.id })
                .getOne();
            if (!row) {
                newDeparts.push({
                    deId: depart.id,
                    deName: depart.name,
                    code: depart.name,
                    parentId: depart.parentId,
                    createTime: now,
                    createBy: 'schedule'
                });
            } else {
                if (depart.name != row.deName) {
                    await context.conn
                        .getRepository(MgDepartEntity)
                        .update({ deId: depart.id }, {
                            deName: depart.name
                        });
                }
            }
        }

        if (newDeparts.length > 0) {
            await context.conn
                .getRepository(MgDepartEntity)
                .save(newDeparts);
        }

        const userDtoList: UserDto[] = await context.client.send({
            cmd: 'wism_wechatwork.user.sync',
        }, 'hot-desking').toPromise();

        const newUsers = [];

        for (const user of userDtoList) {
            const row = await context.conn
                .getRepository(StaffEntity)
                .createQueryBuilder()
                .where('third_party_id=:thirdPartyId', { thirdPartyId: user.thirdPartyId })
                .getOne();

            if (!row) {
                newUsers.push({
                    thirdPartyId: user.thirdPartyId,
                    stName: user.stName,
                    code: user.code,
                    email: user.email || null,
                    stPart: user.stPart,
                    departId: user.departId,
                    createBy: 'schedule',
                    createTime: now
                });
            } else {
                const isNotSame = user.departId != row.departId ||
                    user.stPart != row.stPart ||
                    user.email != row.email ||
                    user.stName != row.stName;
                if (isNotSame) {
                    await context.conn
                        .getRepository(StaffEntity)
                        .update({ thirdPartyId: user.thirdPartyId }, {
                            stName: user.stName,
                            code: user.code,
                            email: user.email || null,
                            stPart: user.stPart,
                            departId: user.departId,
                        });
                }
            }
            if (newUsers.length > 0) {
                await context.conn
                    .getRepository(StaffEntity)
                    .save(newUsers);
            }
        }

        return Promise.resolve('success');
    }
}
