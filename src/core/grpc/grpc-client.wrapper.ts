import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export class GrpcClientWrapper {
    private readonly clientGrpcs: Map<string, ClientGrpc>;
    private readonly tenantId: string;
    constructor(tenantId: string, clientGrpcs: Map<string, ClientGrpc>) {
        this.tenantId = tenantId;
        this.clientGrpcs = clientGrpcs;
    }

    send(pattern, params): Observable<Object> {
        if (typeof params !== 'object') {
            throw new Error('Grpc Params Just Support object!');
        }
        const { cmd } = pattern;
        if (!cmd) {
            throw new Error('Grpc Invoke Service Error: pattern cmd require!');
        }
        const [ groupAndService, rpcSerivce, method ] = cmd.split('.');
        const [ group, service ] = groupAndService.split('_');
        if (!service) {
            throw new Error('Grpc Invoke Service Error: pattern invalid:' + cmd);
        }
        if (!rpcSerivce || !method) {
            throw new Error('Grpc Invoke Method Error: pattern invalid:' + cmd);
        }
        const clientGrpc = this.clientGrpcs.get('GRPC'+ '_' + service.toUpperCase() + '_SERVICE');
        if (!clientGrpc) {
            throw new Error('Grpc Invoke Service Error: service not found:' + service);
        }
        const executor = clientGrpc.getService(rpcSerivce);
        return executor[method].call({}, Object.assign(params, { tenantId: this.tenantId }));
    }
}
