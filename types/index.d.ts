// 將 types 目錄下的主要模組 re-export，並同時暴露放在 ../Types 的細分型別檔
export * from './Http';
export * from './Toast';

// ViewObserver types (放在 ../Types/ViewObserver)
export * from '../Types/ViewObserver/AnimationUtils';
export * from '../Types/ViewObserver/ElementTracker';
export * from '../Types/ViewObserver/ObserverManager';
export * from '../Types/ViewObserver/ViewObserverAPI';

// MicroRenderer types (放在 ../Types/MicroRenderer)
export * from '../Types/MicroRenderer/Component';
export * from '../Types/MicroRenderer/DomManipulator';
export * from '../Types/MicroRenderer/DiffEngine';
export * from '../Types/MicroRenderer/RendererAPI';

// SimpleRouter types (放在 ../Types/SimpleRouter)
export * from '../Types/SimpleRouter/RouteMatcher';
export * from '../Types/SimpleRouter/RouterCore';
export * from '../Types/SimpleRouter/ComponentBridge';
export * from '../Types/SimpleRouter/RouterAPI';

// StateStore types (放在 ../Types/StateStore)
export * from '../Types/StateStore/GlobalRegistry';
export * from '../Types/StateStore/ReactiveEngine';
export * from '../Types/StateStore/StoreModule';
export * from '../Types/StateStore/StateStoreAPI';
export type ToastPosition =
    | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

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
declare module globalThis {
    const Toast: ToastAPI | undefined;
}
