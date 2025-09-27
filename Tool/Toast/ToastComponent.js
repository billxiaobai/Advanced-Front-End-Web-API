// 建立單一 Toast 的 DOM、控制顯示/隱藏、處理自動關閉與暫停（mouseover）
class ToastComponent {
	// constructor 加入 id 參數
	constructor(message, options = {}, id = null) {
		this.id = id;
		this.message = message;
		this.options = options || {};
		this.el = this._createElement();
		this._timer = null;
		this._start = null;
		this._remaining = (typeof this.options.duration === 'number') ? this.options.duration : 0;
		this._resolveUnmount = null;

		// touch/swipe state
		this._touch = { startX: 0, startY: 0, currentX: 0, dragging: false };
		this._bound = {}; // store bound handlers for removal
	}
	_createElement() {
		const wrap = document.createElement('div');
		wrap.className = `toast toast-${this.options.type || 'default'}`;
		wrap.dataset.toastId = this.id != null ? String(this.id) : '';
		// accessibility
		const role = (this.options.type === 'error' || this.options.type === 'danger') ? 'alert' : 'status';
		wrap.setAttribute('role', role);
		wrap.setAttribute('aria-live', (role === 'alert' ? 'assertive' : 'polite'));
		wrap.tabIndex = 0; // allow keyboard focus
		// content
		const content = document.createElement('div');
		content.className = 'toast-content';
		// 儲存引用以利 update
		this._contentEl = content;
		if (typeof this.message === 'string') {
			content.textContent = this.message;
		} else if (this.message instanceof Node) {
			content.appendChild(this.message);
		} else {
			content.textContent = String(this.message);
		}
		wrap.appendChild(content);
		// close button
		if (this.options.showClose) {
			const btn = document.createElement('button');
			btn.className = 'toast-close';
			btn.type = 'button';
			btn.innerHTML = '&times;';
			btn.addEventListener('click', () => this._close());
			wrap.appendChild(btn);
		}
		// mouse pause/resume
		wrap.addEventListener('mouseenter', () => this._pause());
		wrap.addEventListener('mouseleave', () => this._resume());
		return wrap;
	}
	mount(container) {
		return new Promise((resolve) => {
			this._resolveUnmount = resolve;
			container.appendChild(this.el);
			// bind global/element events (keyboard, touch, visibility)
			this._bindEvents();
			// force reflow then show
			requestAnimationFrame(() => {
				this.el.classList.add('show');
				// optionally focus
				if (this.options.focus) {
					try { this.el.focus(); } catch (e) {}
				}
				this._startTimer();
			});
		});
	}
	_bindEvents() {
		// keydown (Esc to close)
		this._bound.keydown = (e) => {
			if (e.key === 'Escape' || e.key === 'Esc') this._close();
		};
		this.el.addEventListener('keydown', this._bound.keydown);

		// touch: swipe to dismiss horizontally
		this._bound.touchstart = (e) => {
			const t = e.touches && e.touches[0];
			if (!t) return;
			this._touch.startX = t.clientX;
			this._touch.startY = t.clientY;
			this._touch.currentX = t.clientX;
			this._touch.dragging = true;
			// disable transition while dragging
			this.el.style.transition = 'none';
			this._pause();
		};
		this._bound.touchmove = (e) => {
			if (!this._touch.dragging) return;
			const t = e.touches && e.touches[0];
			if (!t) return;
			const dx = t.clientX - this._touch.startX;
			const dy = t.clientY - this._touch.startY;
			this._touch.currentX = t.clientX;
			// If vertical move is larger, ignore horizontal swipe to avoid conflict with scrolling
			if (Math.abs(dy) > Math.abs(dx)) return;
			e.preventDefault();
			this.el.style.transform = `translateX(${dx}px)`;
			this.el.style.opacity = Math.max(0, 1 - Math.abs(dx) / (this.el.offsetWidth || 240));
		};
		this._bound.touchend = (e) => {
			if (!this._touch.dragging) return;
			this._touch.dragging = false;
			// restore transition
			this.el.style.transition = '';
			const dx = this._touch.currentX - this._touch.startX;
			const threshold = (this.el.offsetWidth || 240) * 0.35;
			if (Math.abs(dx) > threshold) {
				// animate out and close
				this.el.style.transform = `translateX(${dx > 0 ? '100%' : '-100%'})`;
				this.el.style.opacity = 0;
				// small timeout to allow animation then close
				setTimeout(() => this._close(), 250);
			} else {
				// revert
				this.el.style.transform = '';
				this.el.style.opacity = '';
				this._resume();
			}
		};
		this.el.addEventListener('touchstart', this._bound.touchstart, { passive: true });
		this.el.addEventListener('touchmove', this._bound.touchmove, { passive: false });
		this.el.addEventListener('touchend', this._bound.touchend);

		// visibility change to pause/resume timers
		this._bound.visibility = () => {
			if (document.hidden) this._pause();
			else this._resume();
		};
		document.addEventListener('visibilitychange', this._bound.visibility);
	}
	_removeEvents() {
		try {
			if (this._bound.keydown) this.el.removeEventListener('keydown', this._bound.keydown);
			if (this._bound.touchstart) this.el.removeEventListener('touchstart', this._bound.touchstart);
			if (this._bound.touchmove) this.el.removeEventListener('touchmove', this._bound.touchmove);
			if (this._bound.touchend) this.el.removeEventListener('touchend', this._bound.touchend);
			if (this._bound.visibility) document.removeEventListener('visibilitychange', this._bound.visibility);
		} catch (e) { /* ignore */ }
		this._bound = {};
	}
	_startTimer() {
		if (!this._remaining || this._remaining <= 0) return;
		this._start = Date.now();
		this._timer = setTimeout(() => this._close(), this._remaining);
	}
	_pause() {
		if (!this._timer) return;
		clearTimeout(this._timer);
		this._timer = null;
		this._remaining -= Date.now() - this._start;
	}
	_resume() {
		if (this._timer || !this._remaining || this._remaining <= 0) return;
		this._startTimer();
	}
	// 對外公開的 close (wrapper)
	close() {
		this._close();
	}
	// 新增：允許更新訊息或選項（例如延長 duration）
	update(newMessage, newOptions = {}) {
		if (newMessage !== undefined) {
			this.message = newMessage;
			if (this._contentEl) {
				if (typeof this.message === 'string') {
					this._contentEl.textContent = this.message;
				} else if (this.message instanceof Node) {
					this._contentEl.innerHTML = '';
					this._contentEl.appendChild(this.message);
				} else {
					this._contentEl.textContent = String(this.message);
				}
			}
		}
		if (newOptions && typeof newOptions === 'object') {
			this.options = Object.assign({}, this.options, newOptions);
			if (newOptions.duration !== undefined) {
				this._remaining = newOptions.duration;
				if (this._timer) { clearTimeout(this._timer); this._timer = null; }
				this._startTimer();
			}
			// update visual type/class if changed
			if (newOptions.type) {
				this.el.className = `toast toast-${this.options.type || 'default'}`;
			}
		}
	}
	_close() {
		if (!this.el) {
			if (this._resolveUnmount) this._resolveUnmount();
			return;
		}
		// remove events first to avoid interaction during closing
		this._removeEvents();
		// stop timer
		if (this._timer) { clearTimeout(this._timer); this._timer = null; }
		this.el.classList.remove('show');
		this.el.classList.add('hide');
		const onEnd = (e) => {
			// ensure we wait for opacity/transform transition
			if (e && e.target !== this.el) return;
			this.el.removeEventListener('transitionend', onEnd);
			try { if (this.el.parentNode) this.el.parentNode.removeChild(this.el); } catch (e) {}
			if (this._resolveUnmount) this._resolveUnmount();
		};
		// Fallback if no transitionend occurs
		let fired = false;
		const timer = setTimeout(() => {
			if (fired) return;
			fired = true;
			onEnd();
		}, 600);
		this.el.addEventListener('transitionend', (evt) => {
			if (fired) return;
			fired = true;
			clearTimeout(timer);
			onEnd(evt);
		});
	}
}

module.exports = ToastComponent;