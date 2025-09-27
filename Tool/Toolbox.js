// 使用各套件的 index.js 入口，避免直接引用內部實作檔案
let Toast;
try { Toast = require('./Toast'); } catch (e) { Toast = null; }
let Form;
try { Form = require('./FormState'); } catch (e) { Form = null; }
let HttpModule;
try { HttpModule = require('./Http'); } catch (e) { HttpModule = null; }
const HttpUtils = HttpModule && HttpModule.HttpUtils ? HttpModule.HttpUtils : null;
const HttpConfig = HttpModule && HttpModule.HttpConfig ? HttpModule.HttpConfig : null;

// 改為直接使用各套件 index.js 入口
let ViewObserver;
try { ViewObserver = require('./ViewObserver'); } catch (e) { ViewObserver = null; }

let MicroRenderer;
try { MicroRenderer = require('./MicroRenderer'); } catch (e) { MicroRenderer = null; }

let SimpleRouter;
try { SimpleRouter = require('./SimpleRouter'); } catch (e) { SimpleRouter = null; }

let StateStore;
try { StateStore = require('./StateStore'); } catch (e) { StateStore = null; }

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
	StateStore
};