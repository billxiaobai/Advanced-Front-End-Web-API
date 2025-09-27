const RouterCore = require('../../Tool/SimpleRouter/RouterCore');

describe('RouterCore', () => {
	let core;
	beforeEach(() => {
		core = new RouterCore();
	});

	afterEach(() => {
		try { core.stop(); } catch (e) {}
	});

	test('onChange listener is called on navigate', async () => {
		const listener = jest.fn();
		core.registerRoutes([{ path: '/x', name: 'x' }]);
		core.onChange(listener);
		await core.navigate('/x');
		expect(listener).toHaveBeenCalled();
		const arg = listener.mock.calls[0][0];
		expect(arg.route.name).toBe('x');
	});

	test('beforeEach returning false blocks navigation', async () => {
		const listener = jest.fn();
		core.registerRoutes([{ path: '/blocked', name: 'blocked' }]);
		core.onChange(listener);
		core.setBeforeEach(() => false);
		const res = await core.navigate('/blocked');
		expect(res).toBeNull();
		expect(listener).not.toHaveBeenCalled();
	});

	test('notFound handler is called for unknown routes', async () => {
		const nf = jest.fn();
		core.setNotFound(nf);
		core.registerRoutes([{ path: '/a', name: 'a' }]);
		await core.navigate('/no-such-route');
		expect(nf).toHaveBeenCalled();
	});
});
