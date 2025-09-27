const RouterCore = require('./RouterCore');
const ComponentBridge = require('./ComponentBridge');

function resolveContainer(root) {
	if (!root) return null;
	if (typeof root === 'string') return document.querySelector(root);
	if (root instanceof Element) return root;
	return null;
}

function createRouter(routes = [], options = {}) {
	const core = new RouterCore(options);
	core.registerRoutes(routes);
	const rootEl = resolveContainer(options.root || options.el || '#app');

	let activeInstance = null;
	let activeContainer = rootEl;

	// subscribe to route changes and render
	core.onChange((to) => {
		// cleanup previous
		if (activeInstance) {
			try { ComponentBridge.unmount(activeInstance); } catch (e) {}
			activeInstance = null;
		}
		if (!to || !to.route) return;
		const compDef = to.route.component;
		if (!compDef) return;
		activeContainer = resolveContainer(options.root) || activeContainer;
		try {
			activeInstance = ComponentBridge.mount(compDef, activeContainer, { params: to.params, route: to.route });
		} catch (e) { activeInstance = null; }
	});

	return {
		start() { core.start(); },
		stop() { core.stop(); },
		push(path) { return core.navigate(path, { replace: false }); },
		replace(path) { return core.navigate(path, { replace: true }); },
		go(n) { history.go(n); },
		current() { return { pathname: window.location.pathname, routes: core.getRoutes() }; },
		onChange(fn) { return core.onChange(fn); },
		beforeEach(fn) { core.setBeforeEach(fn); },
		afterEach(fn) { core.setAfterEach(fn); },
		register(route) { core._register(route); },
		findByName(name) { return core.findRouteByName(name); },
		navigateByName(name, params = {}) {
			const r = core.findRouteByName(name);
			if (!r) return null;
			// build simple path by replacing :params
			let path = r.path;
			for (const k in params) path = path.replace(':' + k, encodeURIComponent(params[k]));
			return this.push(path);
		},
		core,
		_componentBridge: ComponentBridge
	};
}

module.exports = {
	createRouter
};
