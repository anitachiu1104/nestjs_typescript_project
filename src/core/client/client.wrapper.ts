import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

export class ClientWrapper<T> {
    private readonly serviceMap: Map<string, ClientProxy>;
    private readonly tenantId: string;
    constructor(tenantId: string, serviceMap: Map<string, ClientProxy>) {
        this.serviceMap = serviceMap;
        this.tenantId = tenantId;
    }
    send(pattern, params): Observable<T> {
        const { cmd } = pattern;
        if (!cmd) {
            throw new Error('Invoke Service Error: pattern cmd require!');
        }
        const [ groupAndService ] = cmd.split('.');
        const [ group, service ] = groupAndService.split('_');
        if (!service) {
            throw new Error('Invoke Service Error: pattern invalid:' + cmd);
        }
        const serviceClient = this.serviceMap.get(service.toUpperCase() + '_SERVICE');
        if (!serviceClient) {
            throw new Error('Invoke Service Error: service not found:' + service);
        }
        return serviceClient.send(pattern, { tenantId: this.tenantId, data: params });
    }
}
