const RouteMatcher = require('./RouteMatcher');

class RouterCore {
	constructor(options = {}) {
		this.base = options.base || '';
		this.routes = []; // { path, name, component, meta }
		this._listeners = new Set();
		this._beforeEach = null;
		this._afterEach = null;
		this._popHandler = this._onPopState.bind(this);
		this._started = false;
		this.notFoundHandler = options.notFound || null;
	}

	_register(route) {
		this.routes.push(route);
	}

	registerRoutes(routes = []) {
		for (const r of routes) this._register(r);
	}

	setBeforeEach(fn) { this._beforeEach = fn; }
	setAfterEach(fn) { this._afterEach = fn; }
	setNotFound(fn) { this.notFoundHandler = fn; }

	start() {
		if (this._started) return;
		window.addEventListener('popstate', this._popHandler);
		this._started = true;
		this._handleLocation(window.location.pathname + window.location.search + window.location.hash);
	}

	stop() {
		if (!this._started) return;
		window.removeEventListener('popstate', this._popHandler);
		this._started = false;
	}

	onChange(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }

	_onPopState() {
		this._handleLocation(window.location.pathname + window.location.search + window.location.hash);
	}

	_resolve(path) {
		// strip base
		let raw = path;
		if (this.base && raw.indexOf(this.base) === 0) raw = raw.slice(this.base.length) || '/';
		// try to match routes in order
		for (const r of this.routes) {
			const res = RouteMatcher.match(r.path, raw);
			if (res.matched) {
				return { route: r, params: res.params, path: raw };
			}
		}
		return null;
	}

	async navigate(path, opts = {}) {
		const state = opts.state || null;
		const replace = !!opts.replace;
		const full = (this.base || '') + path;
		if (replace) {
			history.replaceState(state, '', full);
		} else {
			history.pushState(state, '', full);
		}
		return this._handleLocation(full);
	}

	async _handleLocation(fullPath) {
		const resolved = this._resolve(fullPath);
		if (!resolved) {
			if (typeof this.notFoundHandler === 'function') {
				this.notFoundHandler(fullPath);
			}
			// still notify listeners with null
			for (const l of this._listeners) {
				try { l(null); } catch (e) {}
			}
			return null;
		}
		const to = { path: fullPath, route: resolved.route, params: resolved.params };
		// beforeEach hook
		if (this._beforeEach) {
			try {
				const allow = await this._beforeEach(to);
				if (allow === false) return null;
			} catch (e) { /* ignore */ }
		}
		// notify listeners
		for (const l of this._listeners) {
			try { l(to); } catch (e) {}
		}
		// afterEach hook
		if (this._afterEach) {
			try { this._afterEach(to); } catch (e) {}
		}
		return to;
	}

	getRoutes() { return this.routes.slice(); }
	findRouteByName(name) { return this.routes.find(r => r.name === name) || null; }
}

module.exports = RouterCore;
