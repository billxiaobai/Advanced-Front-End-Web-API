/**
 * Jest tests for Toast API
 * - 放置於 tests/Toast 下
 */

 // polyfill requestAnimationFrame for jsdom + jest fake timers
if (typeof global.requestAnimationFrame !== 'function') {
	global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
}

const Toast = require('../../Tool/Toast/ToastAPI');
const Manager = require('../../Tool/Toast/ToastManager');

describe('Toast API (tests in tests/Toast)', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		// 清理 DOM container 與 manager state
		try { Manager.destroyContainer(); } catch (e) {}
		document.body.innerHTML = '';
		Manager.queue = [];
		Manager.activeToasts.clear();
		Manager._nextId = 1;
		Manager.configure({
			duration: 3000,
			maxVisible: 3,
			position: 'top-right',
			showClose: true,
			type: 'default',
			dedupe: false
		});
	});
	afterEach(async () => {
		// 推進所有 timers，然後回復
		try { jest.runOnlyPendingTimers(); } catch (e) {}
		jest.useRealTimers();
		try { Manager.clearAll(); } catch (e) {}
	});

	test('show returns id/promise and auto-closes after duration', async () => {
		const handle = Toast.show('hello world', { duration: 100 });
		expect(handle).toHaveProperty('id');
		expect(handle).toHaveProperty('promise');

		const container = document.getElementById(Manager.containerId);
		expect(container).not.toBeNull();
		expect(container.children.length).toBeGreaterThan(0);

		// advance timers to trigger auto-close (includes RAF->setTimeout)
		jest.runAllTimers();
		await handle.promise;
		expect(container.children.length).toBe(0);
	});

	test('close(id) closes toast immediately and resolves promise', async () => {
		const handle = Toast.show('to-close', { duration: 5000 });
		const id = handle.id;
		const container = document.getElementById(Manager.containerId);
		expect(container.children.length).toBeGreaterThan(0);

		const closed = Toast.close(id);
		expect(closed).toBe(true);

		jest.runAllTimers();
		await handle.promise;
		expect(document.getElementById(Manager.containerId).children.length).toBe(0);
	});

	test('update(id, {message, options}) updates content and duration', async () => {
		const handle = Toast.show('old message', { duration: 5000 });
		const id = handle.id;
		const container = document.getElementById(Manager.containerId);
		expect(container.children.length).toBeGreaterThan(0);

		const updated = Toast.update(id, { message: 'new message', options: { duration: 50, type: 'info' } });
		expect(updated).toBe(true);

		const el = container.querySelector(`[data-toast-id="${id}"]`);
		expect(el).not.toBeNull();
		expect(el.textContent).toContain('new message');

		jest.runAllTimers();
		await handle.promise;
		expect(document.getElementById(Manager.containerId).children.length).toBe(0);
	});

	test('dedupe: when enabled, identical message+type returns same id or replaces when replace=true', () => {
		Toast.setDefaults({ dedupe: true });
		const a = Toast.show('dup', { type: 'info' });
		const b = Toast.show('dup', { type: 'info' });
		expect(a.id).toBe(b.id);

		const c = Toast.show('dup', { type: 'info', replace: true });
		expect(c.id).toBe(a.id);
	});

	test('priority: higher priority shows before lower priority in queue', () => {
		Manager.configure({ maxVisible: 1 });
		const low = Toast.show('low', { duration: 5000, priority: 1 });
		const high = Toast.show('high', { duration: 5000, priority: 10 });

		// run pending timers to allow mounting
		jest.runOnlyPendingTimers();

		const container = document.getElementById(Manager.containerId);
		expect(container).not.toBeNull();
		const first = container.firstElementChild;
		expect(first).not.toBeNull();
		expect(first.textContent).toContain('high');

		Toast.clear();
	});
});
