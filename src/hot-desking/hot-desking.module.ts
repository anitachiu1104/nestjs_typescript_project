import { Module } from '@nestjs/common';
import { Routes } from 'nest-router';
import { BookingModule } from './booking/booking.module';
import { CheckinModule } from './checkin/checkin.module';
import { DeviceModule } from './device/device.module';
import { MessageModule } from './message/message.module';
import { RepairModule } from './repair/repair.module';
import { SendModule } from './send/send.module';
import { TasksModule } from './tasks/tasks.module';
@Module({
    imports: [
        BookingModule,
        CheckinModule,
        DeviceModule,
        MessageModule,
        RepairModule,
        SendModule,
        TasksModule,
    ]
})
export class HotDeskingModule {}
export const hotDeskingRoutes: Routes = [
    {
        path: '/desk',
        module: HotDeskingModule,
        children: [
            { path: '/', module: BookingModule },
            { path: '/', module: CheckinModule },
            { path: '/', module: RepairModule },
            { path: '/', module: TasksModule },
        ]
    }
];