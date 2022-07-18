import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { ConfigService } from './core/config/config.service';
import { GlobalExceptionFilter } from './core/filter/global-exception.filter';
import { TransformInterceptor } from './core/interceptor/transform.interceptor';
import { RequestLoggerInterceptor } from './core/interceptor/request-logger.interceptor';
import * as xprofiler from 'xprofiler';
import { join } from 'path'
import { renderFile } from 'ejs'
import { NestExpressApplication } from '@nestjs/platform-express';
import { WsAdapter } from '@nestjs/platform-ws';
import * as bodyParser from 'body-parser';
xprofiler.start();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  app.use(session({
    secret: 'wism',
    resave: false,
    saveUninitialized: false
  }));
  app.use(cookieParser());
  app.use(helmet());
  app.enableCors();
  app.useWebSocketAdapter(new WsAdapter(app));
  app.use(bodyParser.json({limit : "2100000kb"}));
  app.useGlobalInterceptors(new RequestLoggerInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  process.on('uncaughtException', (err) => {
    console.log('Caught Exception:' + err);
  });
  process.on('unhandledRejection', (err, promise) => {
    console.log('Caught Rejection:' + err);
  });

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/static/'
  });

  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.engine('html', renderFile);
  app.set('view engine', 'html');

  await app.startAllMicroservices();
  await app.listen(Number(configService.get('SERVER_PORT')));
}
bootstrap();
