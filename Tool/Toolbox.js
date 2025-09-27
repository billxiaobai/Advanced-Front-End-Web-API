const Toast = require('./Toast/ToastAPI');
const Form = require('./FormState/FormAPI');
const HttpUtils = require('./Http/HttpUtils');
const HttpConfig = (() => {
	try { return require('./Http/HttpConfig'); } catch (e) { return null; }
})();

// 新增：引入 ViewObserver（若不存在則為 null）
let ViewObserver;
try { ViewObserver = require('./ViewObserver/ViewObserverAPI'); } catch (e) { ViewObserver = null; }

// 新增：引入 MicroRenderer（容錯處理）
let MicroRenderer;
try { MicroRenderer = require('./MicroRenderer/RendererAPI'); } catch (e) { MicroRenderer = null; }

// 新增：引入 SimpleRouter（容錯處理）
let SimpleRouter;
try { SimpleRouter = require('./SimpleRouter/RouterAPI'); } catch (e) { SimpleRouter = null; }

// 新增：引入 StateStore（容錯處理）
let StateStore;
try { StateStore = require('./StateStore/StateStoreAPI'); } catch (e) { StateStore = null; }

function init(config = {}) {
	// toast defaults
	if (config.toast && Toast && typeof Toast.setDefaults === 'function') {
		Toast.setDefaults(config.toast);
		if (config.toast.container) {
			try { Toast.setContainer(config.toast.container); } catch (e) {}
		}
	}
	// http config
	if (config.http && HttpConfig) {
		try { HttpConfig.configure(config.http); } catch (e) {}
	}
	// form defaults: nothing mandatory, user can call Form.createForm manually
	// 將 ViewObserver 與 MicroRenderer 一併回傳 (若可用)
	return { Toast, Form, HttpUtils, ViewObserver, MicroRenderer, SimpleRouter, StateStore };
}

module.exports = {
	Toast,
	Form,
	HttpUtils,
	init,
	ViewObserver,
	MicroRenderer,
	SimpleRouter,
	// 匯出 StateStore API
	StateStore
};
