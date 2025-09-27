/**
 * 測試重點：
 * - 使用 mock IntersectionObserver 以便模擬 entry 回呼
 * - 使用 fake timers 來控制 AnimationUtils 的排程（requestAnimationFrame -> setTimeout）
 */

describe('ViewObserver API', () => {
	// 簡單的 Mock IntersectionObserver
	class MockIntersectionObserver {
		constructor(cb, options) {
			this.cb = cb;
			this.options = options;
			this.targets = new Set();
			MockIntersectionObserver.lastInstance = this;
		}
		observe(el) { this.targets.add(el); }
		unobserve(el) { this.targets.delete(el); }
		disconnect() { this.targets.clear(); }
		// 測試用：觸發回呼
		simulate(entries) { this.cb(entries); }
	}

	beforeEach(() => {
		jest.useFakeTimers();
		global.IntersectionObserver = MockIntersectionObserver;
		// 讓 requestAnimationFrame 透過 setTimeout 排程（可受 jest.runAllTimers 控制）
		global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
		// 清除被 require 的模組 cach e，確保用到 mock 的 globals
		jest.resetModules();
	});

	afterEach(() => {
		delete global.IntersectionObserver;
		delete global.requestAnimationFrame;
		jest.useRealTimers();
	});

	test('observe triggers callback with entry and tracker', () => {
		const ViewObserver = require('../../Tool/ViewObserver/ViewObserverAPI');
		const el = document.createElement('div');
		document.body.appendChild(el);

		const cb = jest.fn();
		const tracker = ViewObserver.observe(el, cb, { threshold: 0 });

		// 模擬 IntersectionObserver 產生 entry
		MockIntersectionObserver.lastInstance.simulate([{ target: el, isIntersecting: true }]);

		// AnimationUtils 使用 requestAnimationFrame/setTimeout，跑 timers
		jest.runAllTimers();

		expect(cb).toHaveBeenCalled();
		const call = cb.mock.calls[0];
		expect(call[0].target).toBe(el); // entry
		expect(call[1]).toBe(tracker);   // tracker
		expect(tracker.isIntersecting).toBe(true);
	});

	test('unobserve stops callbacks', () => {
		const ViewObserver = require('../../Tool/ViewObserver/ViewObserverAPI');
		const el = document.createElement('div');
		document.body.appendChild(el);

		const cb = jest.fn();
		ViewObserver.observe(el, cb, { threshold: 0 });
		// 取消監聽
		ViewObserver.unobserve(el, cb, { threshold: 0 });

		// 模擬 entry（不該觸發 cb）
		MockIntersectionObserver.lastInstance.simulate([{ target: el, isIntersecting: true }]);
		jest.runAllTimers();

		expect(cb).not.toHaveBeenCalled();
	});
});
