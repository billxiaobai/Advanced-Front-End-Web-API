const AnimationUtils = require('./AnimationUtils');
const ElementTracker = require('./ElementTracker');

class ObserverManager {
	constructor() {
		// key -> { observer, options, elements: Map<element, { callbacks:Set, tracker:ElementTracker }> }
		this.entries = new Map();
		this._rootIds = new WeakMap();
		this._nextRootId = 1;
	}

	_getRootId(root) {
		if (!root) return 'null';
		if (!this._rootIds.has(root)) this._rootIds.set(root, `root#${this._nextRootId++}`);
		return this._rootIds.get(root);
	}

	_getKey(options = {}) {
		const rootId = this._getRootId(options.root || null);
		const rootMargin = options.rootMargin || '0px';
		const threshold = Array.isArray(options.threshold) ? options.threshold.slice() : (typeof options.threshold !== 'undefined' ? [options.threshold] : [0]);
		return `${rootId}|${rootMargin}|${threshold.join(',')}`;
	}

	_normalizeOptions(options = {}) {
		return {
			root: options.root || null,
			rootMargin: options.rootMargin || '0px',
			threshold: Array.isArray(options.threshold) ? options.threshold : (typeof options.threshold !== 'undefined' ? [options.threshold] : [0])
		};
	}

	_createObserver(key, options) {
		const normalized = this._normalizeOptions(options);
		const cb = (entries) => {
			for (const entry of entries) {
				const ent = this.entries.get(key);
				if (!ent) continue;
				const meta = ent.elements.get(entry.target);
				if (!meta) continue;
				// 先更新 tracker
				const changed = meta.tracker.updateFromEntry(entry);
				// 使用 AnimationUtils 合併呼叫 callback，並傳入 entry 與 tracker
				for (const fn of meta.callbacks) {
					AnimationUtils.schedule(() => {
						try { fn(entry, meta.tracker); } catch (e) { /* swallow per-callback error */ }
					});
				}
			}
		};
		const observer = new IntersectionObserver(cb, normalized);
		return {
			observer,
			options: normalized,
			elements: new Map()
		};
	}

	// observe 返回該元素的 ElementTracker（便於 caller 直接讀取狀態）
	observe(element, options = {}, callback) {
		if (!element || typeof callback !== 'function') return null;
		const key = this._getKey(options);
		let entry = this.entries.get(key);
		if (!entry) {
			entry = this._createObserver(key, options);
			this.entries.set(key, entry);
		}
		let meta = entry.elements.get(element);
		if (!meta) {
			meta = { callbacks: new Set(), tracker: new ElementTracker(element) };
			entry.elements.set(element, meta);
			try { entry.observer.observe(element); } catch (e) { /* element may be invalid */ }
		}
		meta.callbacks.add(callback);
		return meta.tracker;
	}

	// unobserve 可傳 callback、或不傳 callback 以移除該 element 所有回呼
	unobserve(element, options = {}, callback) {
		const key = this._getKey(options);
		const entry = this.entries.get(key);
		if (!entry) return;
		const meta = entry.elements.get(element);
		if (!meta) return;
		if (typeof callback === 'function') {
			meta.callbacks.delete(callback);
		} else {
			meta.callbacks.clear();
		}
		if (meta.callbacks.size === 0) {
			entry.elements.delete(element);
			try { entry.observer.unobserve(element); } catch (e) { /* ignore */ }
		}
		// 若沒有任何元素則移除 observer
		if (entry.elements.size === 0) {
			try { entry.observer.disconnect(); } catch (e) {}
			this.entries.delete(key);
		}
	}

	disconnectAll() {
		for (const [key, entry] of this.entries.entries()) {
			try { entry.observer.disconnect(); } catch (e) {}
		}
		this.entries.clear();
	}
}

module.exports = ObserverManager;
