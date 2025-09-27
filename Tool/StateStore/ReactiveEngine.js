function createReactive(initial = {}) {
	const subs = new Set();
	let state = Object.assign({}, initial);

	const notify = (payload) => {
		for (const s of subs) {
			try { s(payload); } catch (e) { /* swallow */ }
		}
	};

	const handler = {
		set(target, prop, value) {
			const prev = target[prop];
			if (prev === value) { target[prop] = value; return true; }
			target[prop] = value;
			state = Object.assign({}, target);
			notify({ type: 'set', key: prop, value, state });
			return true;
		},
		deleteProperty(target, prop) {
			if (prop in target) {
				delete target[prop];
				state = Object.assign({}, target);
				notify({ type: 'delete', key: prop, state });
			}
			return true;
		}
	};

	const proxy = new Proxy(state, handler);

	return {
		proxy,
		subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
		unsubscribe(fn) { subs.delete(fn); },
		setState(partial = {}) {
			if (partial && typeof partial === 'object') {
				for (const k of Object.keys(partial)) proxy[k] = partial[k];
			}
			// also notify overall setState
			notify({ type: 'setState', state: Object.assign({}, proxy) });
		},
		getState() { return Object.assign({}, proxy); }
	};
}

module.exports = {
	createReactive
};
