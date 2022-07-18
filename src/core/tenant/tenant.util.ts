import { TenantConfig } from './tenant.config';
import { ConnectionOptions, Logger, QueryRunner } from 'typeorm';
import * as moment from 'moment';
import { Request } from 'express';

class MyTypeormLogger implements Logger {
  constructor(private tenantId: string) {}
  log(
    level: 'log' | 'info' | 'warn',
    message: any,
    queryRunner?: QueryRunner,
  ): any {}
  logMigration(message: string, queryRunner?: QueryRunner): any {}
  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner): any {
    if (isTestOrDevEnv())
      console.log(
        `\u001b[37m[Typeorm]\u001b[39m` +
          ` \u001b[37m[${this.tenantId}]\u001b[39m` +
          ` \u001b[37m-${moment().format('YYYY-MM-DD HH:mm:ss')}\u001b[39m` +
          ` \u001b[32m${query}\u001b[39m` +
          (parameters
            ? ` \u001b[35m${JSON.stringify(parameters)}\u001b[39m`
            : ''),
      );
  }

  logQueryError(
    error: string | Error,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): any {}

  logQuerySlow(
    time: number,
    query: string,
    parameters?: any[],
    queryRunner?: QueryRunner,
  ): any {}

  logSchemaBuild(message: string, queryRunner?: QueryRunner): any {}
}

export function getConnectionOptions(
  tenantId: string,
  tenantConfig: TenantConfig,
): ConnectionOptions {
  return {
    name: tenantId,
    type: 'mysql',
    host: tenantConfig.dbHost,
    port: Number(tenantConfig.dbPort),
    username: tenantConfig.dbUsername,
    password: tenantConfig.dbPassword,
    database: tenantConfig.dbDatabase,
    entities: ['dist/**/*.entity{.ts,.js}'],
    extra: {
      connectionLimit: tenantConfig.dbConnectionLimit || 13,
    },
    maxQueryExecutionTime: 3000,
    connectTimeout: 20000,
    trace: true,
    logging: true,
    // acquireTimeout: 10000,
  };
}

export function getTenantIdByRequest(req: Request): string {
  return (['development', 'test'].includes(process.env.NODE_ENV)
    ? 'WWONDERS'
    : req.headers.tenantid) as string;
}

export function isTestOrDevEnv() {
  return ['development', 'test'].includes(process.env.NODE_ENV);
}
