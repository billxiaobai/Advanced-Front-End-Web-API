export * from './ToastOptions';
export * from './ToastHandle';
export * from './ToastAPI';
export interface ToastOptions {
    id?: number | string;
    duration?: number; // ms, 0 or negative = sticky
    maxVisible?: number;
    position?: ToastPosition;
    showClose?: boolean;
    type?: 'default' | 'success' | 'error' | 'info' | 'warning' | string;
    priority?: number;
    dedupe?: boolean;
    replace?: boolean;
    focus?: boolean;
    // 任何額外選項
    [key: string]: any;
}

export interface ToastHandle {
    id: number;
    promise: Promise<void>;
    close: () => void;
}

export interface ToastAPI {
    show(message: string | Node, opts?: ToastOptions): ToastHandle;
    success(message: string | Node, opts?: ToastOptions): ToastHandle;
    error(message: string | Node, opts?: ToastOptions): ToastHandle;
    info(message: string | Node, opts?: ToastOptions): ToastHandle;
    warn(message: string | Node, opts?: ToastOptions): ToastHandle;

    config(opts: Partial<ToastOptions & { maxVisible?: number }>): void;
    setDefaults(opts: Partial<ToastOptions & { maxVisible?: number }>): void;
    getDefaults(): Partial<ToastOptions & { maxVisible?: number }>;

    setContainer(containerOrId?: string | HTMLElement): void;
    destroyContainer(): void;

    clear(): void;
    close(id: number): boolean;
    update(id: number, payload: { message?: string | Node; options?: Partial<ToastOptions> }): boolean;
}

// 可選：將 ToastAPI 掛到全域（若專案使用）
declare global {
    interface GlobalThis {
        Toast?: ToastAPI;
    }
}
