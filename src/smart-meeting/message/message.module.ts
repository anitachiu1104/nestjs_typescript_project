import { Module } from '@nestjs/common';
import { BookingAfterHandler } from './booking-after.handler';
import { UserModule } from '../../user/user.module';
import { SignTimeoutHandler } from './sign-timeout.handler';
import { ApprovalTimeoutHandler } from './approval-timeout.handler';
import { UseEndHandler } from './use-end.handler';
import { UseEndBeforeHandler } from './use-end-before.handler';
import { UseStartHandler } from './use-start.handler';


@Module({
    imports: [UserModule],
    controllers: [],
    providers: [
        BookingAfterHandler,
        SignTimeoutHandler,
        ApprovalTimeoutHandler,
        UseEndHandler,
        UseEndBeforeHandler,
        UseStartHandler
    ],
    exports: []
})
export class MessageModule {}
