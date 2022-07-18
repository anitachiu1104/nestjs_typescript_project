export interface SendDelayRequest<T> {
    data: T;
    ttl: number;
}
