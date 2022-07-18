import { Routes } from 'nest-router';
import { Module } from '@nestjs/common';
import { BookingModule } from './booking/booking.module';
import { SendModule } from './send/send.module';
import { MessageModule } from './message/message.module';
import { CheckinModule } from './checkin/checkin.module';
import { ApprovalModule } from './approval/approval.module';
import { RepairModule } from '../smart-meeting/repair/repair.module';

@Module({
    imports: [BookingModule,SendModule,MessageModule,CheckinModule,ApprovalModule,RepairModule],
    controllers: [],
    providers: [],
    exports: []
})
export class SmartMeetingModule {}
export const smartMeetingRoutes: Routes = [{
    path: '/meeting',
    module: SmartMeetingModule,
    children: [
        { path: '/', module: BookingModule },
        { path: '/', module: CheckinModule },
        { path: '/', module: ApprovalModule },
        { path: '/', module: RepairModule }
    ]
}]