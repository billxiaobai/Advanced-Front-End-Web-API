const HttpMain = require('./HttpMain');
const { cleanInput } = require('./HttpUtils');

// 簡單遞迴清理查詢參數：移除 null / undefined / 空字串，trim 字串
function cleanParams(input) {
	if (input == null) return undefined;
	if (typeof input === 'string') {
		const t = input.trim();
		return t === '' ? undefined : t;
	}
	if (Array.isArray(input)) {
		const arr = input.map(cleanParams).filter(v => v !== undefined);
		return arr.length ? arr : undefined;
	}
	if (typeof input === 'object') {
		const out = {};
		Object.keys(input).forEach(k => {
			const v = cleanParams(input[k]);
			if (v !== undefined) out[k] = v;
		});
		return Object.keys(out).length ? out : undefined;
	}
	return input;
}

// 稳定 stringify（排序 keys）用於產生 key
function stableStringify(obj) {
	if (obj === null) return 'null';
	if (typeof obj !== 'object') return JSON.stringify(obj);
	if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
	const keys = Object.keys(obj).sort();
	return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

function makeKey(url, params) {
	const p = params === undefined ? '' : stableStringify(params);
	return `${url}|${p}`;
}

// 建立 query string（簡單處理陣列與物件）
function buildQueryString(params) {
	if (!params || typeof params !== 'object') return '';
	const usp = new URLSearchParams();
	Object.keys(params).forEach(key => {
		const v = params[key];
		if (v === undefined) return;
		if (Array.isArray(v)) {
			for (const item of v) {
				usp.append(key, typeof item === 'object' ? JSON.stringify(item) : String(item));
			}
		} else if (typeof v === 'object') {
			usp.append(key, JSON.stringify(v));
		} else {
			usp.append(key, String(v));
		}
	});
	const s = usp.toString();
	return s ? `?${s}` : '';
}

// pending map 防止重複刪除： key -> Promise
const pendingMap = new Map();

// options 支援：
//  - assemble: boolean (是否把 params 組裝到 URL，預設 true，對 key 與實際請求都有影響)
//  - preventDuplicate: boolean (預設 true，若 false 則不檢查 pending)
//  - force: boolean (繞過 duplicate prevention)
//  - onToast: function(message, meta) (自訂提示回呼)
//  - toast: boolean (若 true 且無 onToast 使用 console.warn)
//  - toastSeverity: 'info'|'warn'|'error' (提示級別，影響 console 方法)
function del(url, params = {}, options = {}) {
	// 1) preprocess params
	const clean = cleanParams(params) || {};

	const assemble = options.assemble !== false; // default true
	const preventDuplicate = options.preventDuplicate !== false;
	const bypass = options.force === true;

	// canonical target for key: if assemble -> include querystring, else use params object
	// 為了產生穩定 key：將 url 與清理後 params 一起序列化
	const key = makeKey(url, clean);

	// 2) duplicate prevention
	if (!bypass && preventDuplicate) {
		const existing = pendingMap.get(key);
		if (existing) return existing;
	}

	// 3) 构建实际请求参数
	// 不再自己組 query string，交給 axios 處理 params（避免 mock 匹配問題）
	const requestUrl = url;
	const requestParams = clean;

	// 4) 建立請求 Promise 並寫入 pendingMap
	const prom = HttpMain.delete(requestUrl, requestParams || {}, options)
		.then(resp => {
			pendingMap.delete(key);
			const status = resp.status;
			
			if (status >= 200 && status < 300) {
				if (options.toastOnSuccess) {
					showToast(`Delete successful: ${requestUrl}`, 'info', options);
				}
				return resp;
			}
			
			const message = `Delete failed: Status ${status} - ${requestUrl}`;
			showToast(message, options.toastSeverity || 'warn', options);
			return resp;
		})
		.catch(err => {
			pendingMap.delete(key);
			
			const status = err.status || (err.response && err.response.status) || 'N/A';
			const message = `Delete failed: Status ${status} - ${requestUrl}`;
			showToast(message, 'error', options);
			
			// 重新包裝錯誤以保持一致性
			if (err.response) {
				const httpError = new HttpMain.HttpError(
					message,
					status,
					err.response.data,
					err.response.headers
				);
				throw httpError;
			}
			throw err;
		});

	if (preventDuplicate && !bypass) pendingMap.set(key, prom);
	return prom;
}

// 修正 showToast
function showToast(message, severity, options = {}) {
    if (typeof options.onToast === 'function') {
        try {
            options.onToast(message, { severity });
        } catch (e) {}
    } else if (options.toast) {
        const method = severity === 'error' ? 'error' : 
                      severity === 'info' ? 'log' : 'warn';
        console[method](message);
    }
    return message;
}

module.exports = {
	delete: del,
};