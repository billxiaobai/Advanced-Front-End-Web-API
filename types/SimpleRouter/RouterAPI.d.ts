export function createRouter(routes?: Array<any>, options?: { root?: Element | string; el?: string; base?: string }): {
	start(): void;
	stop(): void;
	push(path: string): Promise<any>;
	replace(path: string): Promise<any>;
	go(n: number): void;
	current(): { pathname: string; routes: any[] };
	onChange(fn: (to: any) => void): () => void;
	beforeEach(fn: (to: any) => any): void;
	afterEach(fn: (to: any) => void): void;
	register(route: any): void;
	findByName(name: string): any | null;
	navigateByName(name: string, params?: Record<string, string>): Promise<any> | null;
	core: any;
	_componentBridge: any;
};
