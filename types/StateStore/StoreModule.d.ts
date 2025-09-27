declare class StoreModule {
	constructor(name: string, initial?: Record<string, any>);
	name: string;
	state: any;
	getState(): any;
	setState(partial?: Record<string, any>): any;
	set(key: string, value: any): any;
	get(key?: string): any;
	subscribe(fn: (payload: any) => void): () => void;
	destroy(): void;
}
export = StoreModule;
