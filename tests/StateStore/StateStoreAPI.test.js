const StateStore = require('../../Tool/StateStore/StateStoreAPI');

describe('StateStore API', () => {
	afterEach(() => {
		// cleanup any leftover stores
		const names = StateStore.listStores();
		for (const n of names) StateStore.removeStore(n);
	});

	test('createStore and getStore returns instance with initial state', () => {
		const s = StateStore.createStore('s1', { a: 1 });
		expect(StateStore.hasStore('s1')).toBe(true);
		const got = StateStore.getStore('s1');
		expect(got.get('a')).toBe(1);
	});

	test('setState merges partial and get reflects changes', () => {
		const s = StateStore.createStore('s2', { x: 1 });
		s.setState({ y: 2 });
		expect(s.get('x')).toBe(1);
		expect(s.get('y')).toBe(2);
	});

	test('subscribe receives updates and unsubscribe works', () => {
		const s = StateStore.createStore('s3', { v: 0 });
		const cb = jest.fn();
		const unsub = s.subscribe(cb);
		s.set('v', 5);
		expect(cb).toHaveBeenCalled();
		unsub();
		cb.mockClear();
		s.set('v', 6);
		expect(cb).not.toHaveBeenCalled();
	});

	test('listStores and removeStore behave correctly', () => {
		StateStore.createStore('s4', { a: 1 });
		expect(StateStore.listStores()).toContain('s4');
		StateStore.removeStore('s4');
		expect(StateStore.hasStore('s4')).toBe(false);
	});
});
