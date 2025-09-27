export interface HttpResponse<T = any> {
    status: number;
    headers: Record<string, string>;
    data: T;
    cached?: boolean;
}
