declare class Component<P = any, S = any> {
	constructor(props?: P);
	props: P;
	state: S;
	__internal?: any;
	setState(partial: Partial<S>): void;
	render(): any;
	getDom(): Node | null;
	componentWillUnmount?(): void;
}
export = Component;
