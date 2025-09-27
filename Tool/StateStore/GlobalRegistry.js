const registry = new Map();

function register(name, store) {
	if (!name) throw new Error('name required');
	registry.set(name, store);
}

function get(name) {
	return registry.get(name);
}

function has(name) {
	return registry.has(name);
}

function remove(name) {
	return registry.delete(name);
}

function list() {
	return Array.from(registry.keys());
}

module.exports = {
	register,
	get,
	has,
	remove,
	list
};
