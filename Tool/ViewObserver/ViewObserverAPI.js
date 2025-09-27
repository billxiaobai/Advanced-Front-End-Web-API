const ObserverManager = require('./ObserverManager');
const ElementTracker = require('./ElementTracker');

let defaultManager = new ObserverManager();

module.exports = {
	// observe(element, callback, options) -> returns ElementTracker | null
	observe(element, callback, options) {
		return defaultManager.observe(element, options, callback);
	},
	// unobserve(element, [callback], [options])
	unobserve(element, callback, options) {
		return defaultManager.unobserve(element, options, callback);
	},
	// 若要自訂一個 manager（例如不同生命週期）
	createManager() {
		return new ObserverManager();
	},
	ElementTracker
};
