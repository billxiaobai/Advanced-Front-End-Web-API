export interface ToastHandle {
    id: number;
    promise: Promise<void>;
    close: () => void;
}
