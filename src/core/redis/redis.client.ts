import * as Redis from 'ioredis';

export class RedisClient {
    private readonly cluster: Redis.Cluster | Redis.Redis;
    private readonly tenantId: string;
    constructor(tenantId: string, cluster :Redis.Cluster | Redis.Redis) {
        this.cluster = cluster;
        this.tenantId = tenantId;
    }

    close(): void {
        if (!this.cluster) {
            return;
        }

        this.cluster.disconnect();
    }

    async zcard(key: string): Promise<number> {
        return await this.cluster.zcard(`${this.tenantId}:${key}`);
    }

    async zrank(key: string, member: string): Promise<number> {
        return await this.cluster.zrank(`${this.tenantId}:${key}`, member);
    }

    async zcount(key: string, start: number, stop: number): Promise<number> {
        return await this.cluster.zcount(`${this.tenantId}:${key}`, start, stop);
    }

    async zrem(key: string, ...members: Redis.ValueType[]): Promise<number> {
        return await this.cluster.zrem(`${this.tenantId}:${key}`, ...members);
    }

    async zincrby(key: string, increment: number, value: string): Promise<string> {
        return await this.cluster.zincrby(`${this.tenantId}:${key}`, increment, value);
    }

    async zscore(key: string, member: string): Promise<string> {
        return await this.cluster.zscore(`${this.tenantId}:${key}`, member);
    }

    async zrangebysocre(key: string, min: number, max: number, withScores: boolean): Promise<string[]> {
        return await this.cluster.zrangebyscore(`${this.tenantId}:${key}`, min, max, withScores?'WITHSCORES':null);
    }

    async zadd(key: string, ...args: (number|Redis.KeyType) []): Promise<string|number> {
        return await this.cluster.zadd(`${this.tenantId}:${key}`, ...args);
    }

    async zrange(key: string, start: number, stop: number, withScores: boolean|undefined): Promise<string []> {
        if (withScores) {
            return await this.cluster.zrange(`${this.tenantId}:${key}`, start, stop, 'WITHSCORES');
        }
        return await this.cluster.zrange(`${this.tenantId}:${key}`, start, stop);
    }

    async zrevrange(key: string, start: number, stop: number, withScores: boolean|undefined): Promise<string []> {
        if (withScores) {
            return await this.cluster.zrevrange(`${this.tenantId}:${key}`, start, stop, 'WITHSCORES');
        }
        return await this.cluster.zrevrange(`${this.tenantId}:${key}`, start, stop);
    }

    async zrevrangebyscore(key: string, max: number, min: number, withScores: boolean|undefined): Promise<string []> {
        if (withScores) {
            return await this.cluster.zrevrangebyscore(`${this.tenantId}:${key}`, max, min, 'WITHSCORES');
        }
        return await this.cluster.zrevrangebyscore(`${this.tenantId}:${key}`, max, min);
    }

    async zremrangebyscore(key: string, min: number, max: number) {
        return new Promise((resolve, reject) => {
            this.cluster.zremrangebyscore(`${this.tenantId}:${key}`, min, max, (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });
    }

    async zremrangebyrank(key: string, start: number, stop: number) {
        return new Promise((resovle, reject) => {
            this.cluster.zremrangebyrank(`${this.tenantId}:${key}`, start, stop, (err, res) => {
                if (err) return reject(err);
                resovle(res);
            });
        });
    }

    async set(key: string, value: string | object): Promise<'OK'> {
        return await this.cluster.set(`${this.tenantId}:${key}`, typeof value === 'string' ? value : JSON.stringify(value));
    };

    async setEx(key: string, value: string | object, expireSeconds: number): Promise<'OK'> {
        return await this.cluster.set(`${this.tenantId}:${key}`, typeof value === 'string' ? value : JSON.stringify(value), 'EX', expireSeconds);
    };

    async setNx(key: string, value: string | object): Promise<'OK'> {
        return new Promise((resolve, reject) => {
            this.cluster.setnx(`${this.tenantId}:${key}`, typeof value === 'string' ? value : JSON.stringify(value), (err, result) => {
                if (result === 1) {
                    resolve('OK');
                } else {
                    reject(err || 'resource locked!');
                }
            });
        });
    }

    async del(key: string): Promise<number> {
        return await this.cluster.del(`${this.tenantId}:${key}`);
    }

    async get(key): Promise<string> {
        return new Promise((resolve, reject) => {
            this.cluster.get(`${this.tenantId}:${key}`, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            })
        });
    }
}
