const ReactiveEngine = require('./ReactiveEngine');

class StoreModule {
	constructor(name, initial = {}) {
		this.name = name;
		this.engine = ReactiveEngine.createReactive(initial);
		this.state = this.engine.proxy;
		// keep initial snapshot
		this._snapshot = this.engine.getState();
	}
	getState() {
		return this.engine.getState();
	}
	setState(partial = {}) {
		this.engine.setState(partial);
		this._snapshot = this.engine.getState();
		return this.getState();
	}
	set(key, value) {
		this.state[key] = value;
		this._snapshot = this.engine.getState();
		return this.getState();
	}
	get(key) {
		if (typeof key === 'undefined') return this.getState();
		return this.getState()[key];
	}
	subscribe(fn) {
		return this.engine.subscribe(fn);
	}
	destroy() {
		// naive cleanup
		this.engine = null;
		this.state = null;
		this._snapshot = null;
	}
}

module.exports = StoreModule;
