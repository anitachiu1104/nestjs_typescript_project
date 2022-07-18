import { ClientGrpc } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import * as AsyncLock from 'async-lock';
import { GrpcClientWrapper } from './grpc-client.wrapper';

export function getGRpcClient(tenantId: string) {
    return GRpcClientManager.getInstance().get(tenantId);
}

export async function createGRpcClient(tenantId: string, clientGrpcs: Map<string, ClientGrpc>): Promise<GrpcClientWrapper> {
    return GRpcClientManager.getInstance().createGrpcClient(tenantId, clientGrpcs);
}

export class GRpcClientManager {
    private readonly gRpcClientMap: Map<string, object> = new Map<string, object>();
    private static instance;
    private readonly lock: AsyncLock = new AsyncLock();
    private constructor() {}

    public static getInstance() :GRpcClientManager {
        const manager = GRpcClientManager.instance;
        if (manager) {
            return manager;
        } else {
            GRpcClientManager.instance = new GRpcClientManager();
        }
        return GRpcClientManager.instance;
    }

    public has(tenantId: string): boolean {
        return !!this.gRpcClientMap.get(tenantId);
    }

    public get(tenantId: string): any {
        const rpcClient = this.gRpcClientMap.get(tenantId);
        if (!rpcClient) {
            throw new Error(`GRpcClientNotFoundError: Client ${tenantId} was not found.`)
        }
        return rpcClient;
    }

    public async createGrpcClient(tenantId: string, clientGrpcs: Map<string, ClientGrpc>): Promise<GrpcClientWrapper> {
        return await this.lock.acquire<GrpcClientWrapper>(tenantId, () => {
            if (this.has(tenantId)) {
                return this.get(tenantId);
            }
            const clientWrapper = new GrpcClientWrapper(tenantId, clientGrpcs);
            this.gRpcClientMap.set(tenantId, clientWrapper);
            Logger.log('GRpcClient Create Success', tenantId);
            return clientWrapper;
        });

    }
}
