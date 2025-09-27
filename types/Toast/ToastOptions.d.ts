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
