import { ClientProxy } from '@nestjs/microservices';
import { ClientWrapper } from "./client.wrapper";
import * as AsyncLock from 'async-lock';
import { Logger } from '@nestjs/common';

export function getRpcClient(tenantId: string) {
    return RpcClientManager.getInstance().get(tenantId);
}

export async function createRpcClient(tenantId: string, serviceMap: Map<string, ClientProxy>): Promise<ClientWrapper<any>> {
    return RpcClientManager.getInstance().createClient(tenantId, serviceMap);
}

export class RpcClientManager {
    private readonly rpcClientMap: Map<string, object> = new Map<string, object>();
    private static instance;
    private readonly lock: AsyncLock = new AsyncLock();
    private constructor() {}

    public static getInstance() :RpcClientManager {
        const manager = RpcClientManager.instance;
        if (manager) {
            return manager;
        } else {
            RpcClientManager.instance = new RpcClientManager();
        }
        return RpcClientManager.instance;
    }

    public has(tenantId: string): boolean {
        return !!this.rpcClientMap.get(tenantId);
    }

    public get(tenantId: string): any {
        const rpcClient = this.rpcClientMap.get(tenantId);
        if (!rpcClient) {
            throw new Error(`RpcClientNotFoundError: Client ${tenantId} was not found.`)
        }
        return rpcClient;
    }

    public async createClient(tenantId: string, serviceMap: Map<string, ClientProxy>): Promise<ClientWrapper<any>> {
        return await this.lock.acquire<ClientWrapper<any>>(tenantId, () => {
            if (this.has(tenantId)) {
                return this.get(tenantId);
            }
            const clientWrapper = new ClientWrapper(tenantId, serviceMap);
            this.rpcClientMap.set(tenantId, clientWrapper);
            Logger.log('RpcClient Create Success', tenantId);
            return clientWrapper;
        });

    }
}
