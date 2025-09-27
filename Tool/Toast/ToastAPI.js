const Manager = require('./ToastManager');

module.exports = {
	// 基本呼叫：回傳 { id, promise, close }
	show: (message, opts) => Manager.show(message, opts),
	// 便利方法（保持回傳結構一致）
	success: (message, opts = {}) => Manager.show(message, Object.assign({}, opts, { type: 'success' })),
	error: (message, opts = {}) => Manager.show(message, Object.assign({}, opts, { type: 'error' })),
	info: (message, opts = {}) => Manager.show(message, Object.assign({}, opts, { type: 'info' })),
	warn: (message, opts = {}) => Manager.show(message, Object.assign({}, opts, { type: 'warning' })),
	// 設定與清除
	config: (opts) => Manager.configure(opts),
	clear: () => Manager.clearAll(),
	// 新增：靜態預設選項存取
	setDefaults: (opts) => Manager.configure(opts),
	getDefaults: () => Object.assign({}, Manager.defaults),
	// 新增：容器管理
	setContainer: (containerOrId) => Manager.setContainer(containerOrId),
	destroyContainer: () => Manager.destroyContainer(),
	// 新增：以 id 關閉或更新
	close: (id) => Manager.close(id),
	update: (id, payload) => Manager.update(id, payload)
};
