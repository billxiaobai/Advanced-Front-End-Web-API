const HttpConfig = require('./Tool/Http/HttpConfig');
const Toast = require('./Tool/Toast/ToastAPI');

function isObject(v) {
	return v && typeof v === 'object' && !Array.isArray(v);
}
function mergeDeep(target, source) {
	if (!isObject(source)) return target;
	target = target || {};
	for (const key of Object.keys(source)) {
		const srcVal = source[key];
		if (isObject(srcVal)) {
			target[key] = mergeDeep(target[key] || {}, srcVal);
		} else {
			target[key] = srcVal;
		}
	}
	return target;
}

/**
 * initApp(userConfig)
 * userConfig: {
 *   http: { baseURL, timeout, headers },
 *   advanced: { cache: {...}, post: {...}, put: {...}, delete: {...} },
 *   toast: { position, duration, maxVisible, showClose, dedupe, ... },
 *   interceptors: { request: [fn,...], response: [{onFulfilled,onRejected}, ...] },
 *   validators: { name: fn, ... },
 *   transformers: { name: fn, ... },
 *   exposeGlobalToast: boolean,
 *   autoNotifyDelete: boolean
 * }
 */
function initApp(userConfig = {}) {
	// 預設設定（可由使用者覆寫）
	const defaults = {
		http: {
			baseURL: 'https://jsonplaceholder.typicode.com',
			timeout: 5000,
			headers: {}
		},
		advanced: {
			cache: {
				enabled: true,
				defaultTTL: 30000
			},
			post: {
				defaultDebounceMs: 800,
				preventDuplicate: true
			},
			put: {
				preventDuplicate: true,
				optimisticLock: true
			},
			delete: {
				preventDuplicate: true,
				toast: true,
				toastSeverity: 'warn'
			}
		},
		toast: {
			position: 'top-right',
			duration: 4000,
			maxVisible: 3,
			showClose: true,
			dedupe: false
		},
		interceptors: {
			request: [], // fn(config) => config
			response: [] // { onFulfilled, onRejected }
		},
		validators: {}, // name: fn
		transformers: {}, // name: fn
		exposeGlobalToast: true,
		autoNotifyDelete: true
	};

	const cfg = mergeDeep(mergeDeep({}, defaults), userConfig);

	// HTTP 設定
	if (cfg.http) {
		HttpConfig.configure({
			baseURL: cfg.http.baseURL,
			timeout: cfg.http.timeout,
			headers: cfg.http.headers
		});
	}

	// advanced 設定
	if (cfg.advanced) {
		HttpConfig.configureAdvanced(cfg.advanced);
	}

	// 註冊 validators
	if (cfg.validators && typeof cfg.validators === 'object') {
		for (const [name, fn] of Object.entries(cfg.validators)) {
			if (typeof fn === 'function') HttpConfig.addValidator(name, fn);
		}
	}

	// 註冊 transformers
	if (cfg.transformers && typeof cfg.transformers === 'object') {
		for (const [name, fn] of Object.entries(cfg.transformers)) {
			if (typeof fn === 'function') HttpConfig.addTransformer(name, fn);
		}
	}

	// 註冊攔截器（request）
	if (Array.isArray(cfg.interceptors.request)) {
		for (const reqFn of cfg.interceptors.request) {
			if (typeof reqFn === 'function') HttpConfig.addRequestInterceptor(reqFn);
		}
	}

	// 註冊攔截器（response）
	if (Array.isArray(cfg.interceptors.response)) {
		for (const pair of cfg.interceptors.response) {
			if (!pair) continue;
			const onFulfilled = typeof pair.onFulfilled === 'function' ? pair.onFulfilled : (r) => r;
			const onRejected = typeof pair.onRejected === 'function' ? pair.onRejected : (e) => Promise.reject(e);
			HttpConfig.addResponseInterceptor(onFulfilled, onRejected);
		}
	}

	// Toast 全域預設
	if (cfg.toast) {
		Toast.setDefaults({
			position: cfg.toast.position,
			duration: cfg.toast.duration,
			maxVisible: cfg.toast.maxVisible,
			showClose: cfg.toast.showClose,
			dedupe: cfg.toast.dedupe
		});
		if (cfg.toast.container) {
			Toast.setContainer(cfg.toast.container);
		}
	}

	// 是否暴露到 globalThis
	if (cfg.exposeGlobalToast && typeof globalThis !== 'undefined') {
		globalThis.Toast = Toast;
	}

	// 若 advanced delete toast 且 autoNotifyDelete 開啟，顯示一個示範提示（可關閉）
	if (cfg.advanced && cfg.advanced.delete && cfg.advanced.delete.toast && cfg.autoNotifyDelete) {
		Toast.show(`Delete toast enabled (severity: ${cfg.advanced.delete.toastSeverity || 'warn'})`, {
			type: cfg.advanced.delete.toastSeverity || 'warning',
			duration: Math.max(1000, Math.min(10000, cfg.toast.duration || 4000))
		});
	}

	// 回傳合併後設定與工具
	return {
		config: cfg,
		HttpConfig,
		Toast
	};
}

// 當此檔案被直接執行或 require 時，自動以預設啟動（可透過傳入參數 override）
const defaultInstance = initApp();
module.exports = {
	initApp,
	defaultInstance
};