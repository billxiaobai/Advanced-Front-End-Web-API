const ToastComponent = require('./ToastComponent');

class ToastManager {
	constructor() {
		this.queue = [];
		this.activeCount = 0;
		this.defaults = {
			duration: 3000,
			maxVisible: 3,
			position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
			showClose: true,
			type: 'default',
			dedupe: false // 新增：預設不去重
		};
		this.containerId = 'toast-root';
		// 新增：可指定實體 container element
		this.containerElement = null;
		// 新增：id 產生與追蹤
		this._nextId = 1;
		// activeToasts 存放更多資訊：{ toast, container, priority, doneResolve }
		this.activeToasts = new Map();
		this._ensureDocument();
	}
	_ensureDocument() {
		this._isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
	}
	_getContainer() {
		if (!this._isBrowser) return null;
		// 優先實體元素
		if (this.containerElement && this.containerElement instanceof HTMLElement) return this.containerElement;
		let c = document.getElementById(this.containerId);
		if (!c) {
			c = document.createElement('div');
			c.id = this.containerId;
			c.className = `toast-container ${this.defaults.position}`;
			document.body.appendChild(c);
		}
		return c;
	}
	// 新增：允許開發者設定 container（DOM element 或 id 字串）
	setContainer(containerOrId) {
		if (!this._isBrowser) return;
		if (!containerOrId) {
			this.containerElement = null;
			return;
		}
		if (typeof containerOrId === 'string') {
			this.containerId = containerOrId;
			this.containerElement = null;
		} else if (containerOrId instanceof HTMLElement) {
			this.containerElement = containerOrId;
		}
		// 調整 class 以符合 position
		const container = this._getContainer();
		if (container) container.className = `toast-container ${this.defaults.position}`;
	}
	// 新增：銷毀目前自動建立的 container（不會移除使用者提供的 element）
	destroyContainer() {
		if (!this._isBrowser) return;
		if (this.containerElement) {
			this.containerElement = null;
			return;
		}
		const c = document.getElementById(this.containerId);
		if (c) {
			try { c.parentNode.removeChild(c); } catch (e) {}
		}
	}
	configure(opts = {}) {
		Object.assign(this.defaults, opts);
		const container = this._getContainer();
		if (container) {
			container.className = `toast-container ${this.defaults.position}`;
		}
	}
	// show 現在回傳 { id, promise, close }
	show(message, opts = {}) {
		if (!this._isBrowser) {
			// server-side: no-op but keep compatibility
			// 回傳一個 resolved promise 以維持接口一致性
			const id = this._nextId++;
			return { id, promise: Promise.resolve(), close: () => {} };
		}
		const options = Object.assign({}, this.defaults, opts);
		const id = this._nextId++;
		// dedupe 支援：相同文字與 type 時可選擇返回現有或替換
		if (options.dedupe) {
			// check active toasts
			for (const [tid, entry] of this.activeToasts.entries()) {
				const tmsg = (entry.toast && entry.toast.message) ? String(entry.toast.message) : '';
				if (tmsg === String(message) && (entry.toast.options && entry.toast.options.type) === options.type) {
					if (options.replace) {
						entry.toast.update(message, options);
						return { id: tid, promise: Promise.resolve(), close: () => this.close(tid) };
					} else {
						// return existing handle
						return { id: tid, promise: Promise.resolve(), close: () => this.close(tid) };
					}
				}
			}
			// check queue
			for (let q of this.queue) {
				if (String(q.message) === String(message) && q.options.type === options.type) {
					if (options.replace) {
						q.message = message;
						q.options = Object.assign({}, q.options, options);
						return { id: q.id, promise: Promise.resolve(), close: () => this.close(q.id) };
					} else {
						return { id: q.id, promise: Promise.resolve(), close: () => this.close(q.id) };
					}
				}
			}
		}

		let doneResolve;
		const donePromise = new Promise((resolve) => { doneResolve = resolve; });
		// include priority for sorting (higher first). default 0.
		const priority = Number(options.priority) || 0;
		this.queue.push({ id, message, options, doneResolve, priority });
		// sort queue by priority desc to ensure higher priority shown first
		this.queue.sort((a, b) => b.priority - a.priority);

		const container = this._getContainer();

		// 若有空位，立即顯示（能即時被測試觀察到 DOM）
		if (container && this.activeCount < this.defaults.maxVisible && this.queue.length > 0) {
			const item = this.queue.shift();
			this._showOne(item, container);
		} else if (container && this.queue.length > 0) {
			// 無空位時嘗試搶位：若 queued 的優先度高於目前 active 最低者，則同步移除最低並立刻顯示 queued
			const topQueued = this.queue[0];
			// 找出當前 active 中最低優先度的 toast
			let lowest = null; // { id, priority }
			for (const [aid, entry] of this.activeToasts.entries()) {
				const p = (entry && entry.priority) ? entry.priority : ((entry.toast && entry.toast.options && entry.toast.options.priority) ? entry.toast.options.priority : 0);
				if (lowest == null || p < lowest.priority) {
					lowest = { id: aid, priority: Number(p) || 0 };
				}
			}
			if (topQueued && lowest && topQueued.priority > lowest.priority) {
				const removeEntry = this.activeToasts.get(lowest.id);
				if (removeEntry) {
					try {
						// 主動移除 DOM、清事件/計時器，並同步 resolve 該 toast 的 done promise
						if (removeEntry.toast && typeof removeEntry.toast._removeEvents === 'function') removeEntry.toast._removeEvents();
						if (removeEntry.toast && removeEntry.toast._timer) { clearTimeout(removeEntry.toast._timer); removeEntry.toast._timer = null; }
						if (removeEntry.toast && removeEntry.toast.el && removeEntry.toast.el.parentNode) {
							try { removeEntry.toast.el.parentNode.removeChild(removeEntry.toast.el); } catch (e) {}
						}
						// resolve promise if available
						if (typeof removeEntry.doneResolve === 'function') {
							try { removeEntry.doneResolve(); } catch (e) {}
						}
					} catch (e) { /* ignore */ }
					// 移除紀錄並調整計數
					this.activeToasts.delete(lowest.id);
					this.activeCount = Math.max(0, this.activeCount - 1);
				}
				// 立即從 queue 顯示下一個（因為我們剛釋出一個位子）
				if (this.queue.length > 0) {
					const item = this.queue.shift();
					this._showOne(item, container);
				}
			}
		}

		return {
			id,
			promise: donePromise,
			close: () => this.close(id)
		};
	}
	_processQueue() {
		if (!this._isBrowser) return;
		const container = this._getContainer();
		if (!container) return;
		while (this.activeCount < this.defaults.maxVisible && this.queue.length > 0) {
			const item = this.queue.shift();
			this._showOne(item, container);
		}
	}
	_showOne({ id, message, options, doneResolve }, container) {
		// 建立並 mount
		this.activeCount++;
		const toast = new ToastComponent(message, options, id);
		const priority = Number(options.priority) || 0;
		// 記錄 doneResolve 以利強制移除時可 resolve
		this.activeToasts.set(id, { toast, container, priority, doneResolve });
		toast.mount(container).then(() => {
			// 當元件完成卸載時清理並 resolve
			const entry = this.activeToasts.get(id);
			// 若 entry 存在且 doneResolve 尚未被呼叫，使用該 doneResolve
			if (entry && typeof entry.doneResolve === 'function') {
				try { entry.doneResolve(); } catch (e) {}
			}
			this.activeToasts.delete(id);
			this.activeCount = Math.max(0, this.activeCount - 1);
			this._processQueue();
		});
	}
	// 新增：以 id 關閉 toast（若存在）
	close(id) {
		// if active, close
		const entry = this.activeToasts.get(id);
		if (entry && entry.toast && typeof entry.toast.close === 'function') {
			entry.toast.close();
			return true;
		}
		// 若在 queue 中，移除並 resolve其 promise
		const qi = this.queue.findIndex(q => q.id === id);
		if (qi >= 0) {
			const [item] = this.queue.splice(qi, 1);
			try { if (item && typeof item.doneResolve === 'function') item.doneResolve(); } catch (e) {}
			return true;
		}
		return false;
	}
	// 新增：以 id 更新 toast 內容或選項（若尚在畫面上）
	update(id, { message, options } = {}) {
		// update active
		const entry = this.activeToasts.get(id);
		if (entry && entry.toast && typeof entry.toast.update === 'function') {
			entry.toast.update(message, options || {});
			// 更新 priority 若有提供
			if (options && options.priority !== undefined) entry.priority = Number(options.priority) || 0;
			return true;
		}
		// update queued
		for (let q of this.queue) {
			if (q.id === id) {
				if (message !== undefined) q.message = message;
				if (options !== undefined) {
					q.options = Object.assign({}, q.options, options);
					if (options.priority !== undefined) q.priority = Number(options.priority) || 0;
				}
				// 重新排序若有 priority 變動
				this.queue.sort((a, b) => b.priority - a.priority);
				return true;
			}
		}
		return false;
	}
	clearAll() {
		// 清空佇列並移除容器內的 element（立即結束所有顯示）
		this.queue = [];
		if (!this._isBrowser) return;
		const container = this._getContainer();
		if (!container) return;
		// close active toasts gracefully
		for (const [id, entry] of Array.from(this.activeToasts.entries())) {
			try { if (entry && entry.toast && typeof entry.toast.close === 'function') entry.toast.close(); } catch (e) {}
		}
		// remove container children after closing
		Array.from(container.children).forEach(ch => {
			try { ch.remove(); } catch (e) { /* ignore */ }
		});
		this.activeCount = 0;
		// 清除 activeToasts map
		this.activeToasts.clear();
	}
}

module.exports = new ToastManager();