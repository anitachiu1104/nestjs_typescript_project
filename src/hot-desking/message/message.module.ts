import { Module } from '@nestjs/common';
import { SignTimeoutHandler } from './sign-timeout.handler';
import { DemoHandler } from './demo.handler';
import { UseEndCloseSocketHandler } from './use-end-closesocket.handler';
import { UseEndClearScreenHandler } from './use-end-clearscreen.handler';
import { SignBeforeHandler } from './sign-before.handler';
import { SignStartHandler } from './sign-start.handler';
import { UseEndBeforeHandler } from './use-end-before.handler';
import { UserModule } from '../../user/user.module';
import { UseEndHandler } from './use-end.handler';

@Module({
    imports: [UserModule],
    controllers: [],
    providers: [
        UseEndHandler,
        SignTimeoutHandler,
        DemoHandler,
        UseEndCloseSocketHandler,
        UseEndClearScreenHandler,
        SignBeforeHandler,
        SignStartHandler,
        UseEndBeforeHandler,
    ],
    exports: []
})
export class MessageModule {}
