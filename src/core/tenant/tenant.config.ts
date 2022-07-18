export interface TenantConfig {
    dbType: string;
    dbHost: string;
    dbPort: number;
    dbUsername: string;
    dbPassword: string;
    dbDatabase: string;
    dbConnectionLimit?: number;
    rabbitmqHost: string;
    rabbitmqPort: number;
    rabbitmqUsername: string;
    rabbitmqPassword: string;
    redisHosts: string;
    redisPassword?: string;
    serviceName?: string;
    tenantId?: string;
    env?: string;
}
