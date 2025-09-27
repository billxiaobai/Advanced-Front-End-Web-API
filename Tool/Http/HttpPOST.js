const HttpMain = require('./HttpMain');
const { cleanInput } = require('./HttpUtils');

// 穩定 stringify（排序 keys）用於產生 key
function stableStringify(obj) {
	if (obj === null) return 'null';
	if (typeof obj !== 'object') return JSON.stringify(obj);
	if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
	const keys = Object.keys(obj).sort();
	return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

// 遞迴合併 defaults 並清理 null/undefined/空字串；filterFn 可進一步過濾/轉換結果
function cleanAndFillData(data = {}, defaults = {}, filterFn) {
    // 先合併預設值
    const merged = Object.assign({}, defaults, data);
    
    // 清理並保留所有預設值
    const cleaned = Object.entries(merged).reduce((acc, [key, value]) => {
        const cleanedValue = cleanInput(value);
        // 如果是預設值，即使清理後為 undefined 也要保留
        if (cleanedValue !== undefined || key in defaults) {
            acc[key] = cleanedValue ?? defaults[key];
        }
        return acc;
    }, {});

    return typeof filterFn === 'function' ? filterFn(cleaned) || cleaned : cleaned;
}

// 檢查物件中是否有可能代表檔案/Buffer/Stream 的值（簡單偵測）
function containsFileLike(obj) {
	if (obj == null) return false;
	if (typeof obj === 'object') {
		if (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj)) return true;
		// Node stream detection (very loose)
		if (obj && typeof obj.pipe === 'function') return true;
		for (const k of Object.keys(obj)) {
			if (containsFileLike(obj[k])) return true;
		}
	}
	return false;
}

// 將資料轉為可上傳表單：若環境提供 FormData 使用之，否則使用 URLSearchParams（Node-friendly）
function toFormBody(obj) {
	// 若在瀏覽器有 FormData，使用它
	if (typeof FormData !== 'undefined') {
		const fd = new FormData();
		Object.keys(obj).forEach(k => {
			const v = obj[k];
			if (v === undefined) return;
			if (typeof v === 'object' && !(v instanceof Blob) && !(v instanceof File)) {
				fd.append(k, JSON.stringify(v));
			} else {
				fd.append(k, v);
			}
		});
		return fd;
	}
	// Node fallback：URLSearchParams
	const params = new URLSearchParams();
	Object.keys(obj).forEach(k => {
		const v = obj[k];
		if (v === undefined) return;
		if (typeof v === 'object') {
			params.append(k, JSON.stringify(v));
		} else {
			params.append(k, String(v));
		}
	});
	return params;
}

// in-memory maps for throttle & debounce
const throttleMap = new Map(); // key -> { lastTime, lastPromise }
const debounceMap = new Map(); // key -> { timer, queue: [ {resolve,reject} ], lastPayload }

function makeKey(url, payload) {
	return `${url}|${stableStringify(payload)}`;
}

// options supported:
//  - defaults: object to merge in as defaults
//  - filter: function(data) => filteredData
//  - form: boolean (force form encoding)
//  - throttleMs: number
//  - debounceMs: number
//  - force: boolean (bypass throttle/debounce)
//  - ... other options forwarded to HttpMain.post
function post(url, data = {}, options = {}) {
	// 1) preprocess
	const defaults = options.defaults || {};
	const filterFn = options.filter;
	const cleaned = cleanAndFillData(data, defaults, filterFn) || {};

	// 2) detect/form encode if requested
	const needForm = options.form === true || containsFileLike(cleaned);
	let body = cleaned;
	if (needForm) {
		body = toFormBody(cleaned);
	}

	const key = makeKey(url, cleaned);
	const throttleMs = typeof options.throttleMs === 'number' ? options.throttleMs : 0;
	const debounceMs = typeof options.debounceMs === 'number' ? options.debounceMs : 0;
	const bypass = options.force === true;

	// 使用 endpoint URL 作為 debounce 的 key（合併不同 payload 的快速呼叫）
	const debounceKey = url;

	// 3) debounce logic
	if (!bypass && debounceMs > 0) {
		let entry = debounceMap.get(debounceKey);
		if (!entry) {
			entry = { timer: null, resolvers: [], lastPayload: null };
			debounceMap.set(debounceKey, entry);
		}

		// 每次呼叫都註冊 resolver，並更新 lastPayload 為最新的資料
		entry.lastPayload = { url, body, options };
		return new Promise((resolve, reject) => {
			entry.resolvers.push({ resolve, reject });
			// 重置計時器
			if (entry.timer) clearTimeout(entry.timer);
			entry.timer = setTimeout(async () => {
				try {
					const { url: u, body: b, options: o } = entry.lastPayload;
					const result = await HttpMain.post(u, b, o);
					entry.resolvers.forEach(r => r.resolve(result));
				} catch (err) {
					entry.resolvers.forEach(r => r.reject(err));
				} finally {
					debounceMap.delete(debounceKey);
				}
			}, debounceMs);
		});
	}

	// 4) throttle logic
	if (!bypass && throttleMs > 0) {
		const now = Date.now();
		const lastEntry = throttleMap.get(key);
		if (lastEntry && lastEntry.lastTime + throttleMs > now) {
			// Throttle active, return last promise
			return lastEntry.lastPromise;
		}

		// 更新最後執行時間
		throttleMap.set(key, { lastTime: now, lastPromise: null });
	}

	// 5) do the request
	return HttpMain.post(url, body, options);
}

module.exports = { post, cleanAndFillData, stableStringify, toFormBody };