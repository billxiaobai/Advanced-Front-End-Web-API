export interface HttpOptions {
    params?: Record<string, any>;
    data?: any;
    headers?: Record<string, string>;
    axiosConfig?: any;
    retry?: number;
    retryDelay?: number;
    cache?: boolean;
    cacheTTL?: number;
    force?: boolean;
    validate?: (data: any) => boolean | any;
    transform?: (data: any) => any;
}
