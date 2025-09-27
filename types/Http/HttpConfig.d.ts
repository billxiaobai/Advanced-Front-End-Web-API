export interface HttpConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}
