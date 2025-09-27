const GlobalRegistry = require('./GlobalRegistry');
const StoreModule = require('./StoreModule');

function createStore(name, initial = {}) {
	if (!name) throw new Error('store name required');
	if (GlobalRegistry.has(name)) return GlobalRegistry.get(name);
	const s = new StoreModule(name, initial);
	GlobalRegistry.register(name, s);
	return s;
}

function getStore(name) {
	return GlobalRegistry.get(name) || null;
}

function hasStore(name) {
	return GlobalRegistry.has(name);
}

function removeStore(name) {
	const s = GlobalRegistry.get(name);
	if (s) {
		try { s.destroy(); } catch (e) {}
	}
	return GlobalRegistry.remove(name);
}

function listStores() {
	return GlobalRegistry.list();
}

module.exports = {
	createStore,
	getStore,
	hasStore,
	removeStore,
	listStores
};
