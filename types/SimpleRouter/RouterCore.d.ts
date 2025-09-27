declare class RouterCore {
	constructor(options?: { base?: string; notFound?: (path: string) => void });
	registerRoutes(routes: Array<any>): void;
	_register(route: any): void;
	setBeforeEach(fn: (to: any) => any): void;
	setAfterEach(fn: (to: any) => void): void;
	setNotFound(fn: (path: string) => void): void;
	start(): void;
	stop(): void;
	onChange(fn: (to: any) => void): () => void;
	navigate(path: string, opts?: { state?: any; replace?: boolean }): Promise<any>;
	getRoutes(): any[];
	findRouteByName(name: string): any | null;
}
export = RouterCore;
