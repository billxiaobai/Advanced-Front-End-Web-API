export function createReactive(initial?: Record<string, any>): {
	proxy: any;
	subscribe(fn: (payload: any) => void): () => void;
	unsubscribe(fn: (payload: any) => void): void;
	setState(partial?: Record<string, any>): void;
	getState(): any;
};
