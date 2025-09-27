import Component = require('./Component');

declare function create<T extends Component>(componentClass: new (...args: any[]) => T, props?: any): T;

declare function createRenderer(): {
	mount(component: any, container: Element): Node | null;
	updateComponent(component: any): Node | null;
	unmountComponent(component: any): void;
};

declare const defaultRenderer: {
	mount(component: any, container: Element): Node | null;
	updateComponent(component: any): Node | null;
	unmountComponent(component: any): void;
};

declare const RendererAPI: {
	create: typeof create;
	createRenderer: typeof createRenderer;
	defaultRenderer: typeof defaultRenderer;
	mount(component: any, container: Element): Node | null;
	update(component: any): Node | null;
	unmount(component: any): void;
};

export = RendererAPI;
