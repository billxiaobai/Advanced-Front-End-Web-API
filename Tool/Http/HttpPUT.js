const HttpMain = require('./HttpMain');

// 穩定 stringify（排序 keys）用於產生 key
function stableStringify(obj) {
	if (obj === null) return 'null';
	if (typeof obj !== 'object') return JSON.stringify(obj);
	if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
	const keys = Object.keys(obj).sort();
	return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

// 遞迴比對原始與更新資料，回傳只包含改變欄位的物件（若無變化回傳空物件）
function diff(original = {}, updated = {}) {
	if (original === updated) return {};
	if (typeof original !== 'object' || typeof updated !== 'object' || original === null || updated === null) {
		// 非物件類型或不同型別，直接回傳 updated（表示整個欄位被替換）
		return updated;
	}
	if (Array.isArray(original) || Array.isArray(updated)) {
		// 陣列改變視為全部替換
		if (JSON.stringify(original) === JSON.stringify(updated)) return {};
		return updated;
	}
	const out = {};
	let hasChange = false;
	const keys = new Set([...Object.keys(original), ...Object.keys(updated)]);
	for (const k of keys) {
		const o = original[k];
		const u = updated[k];
		if (typeof o === 'object' && o !== null && typeof u === 'object' && u !== null) {
			const sub = diff(o, u);
			if (typeof sub === 'object' && Object.keys(sub).length > 0) {
				out[k] = sub;
				hasChange = true;
			}
		} else {
			// 將 undefined 視為刪除（若需要可保留）
			if (o !== u) {
				out[k] = u;
				hasChange = true;
			}
		}
	}
	return hasChange ? out : {};
}

// pending map 防止重複提交： key -> Promise
const pendingMap = new Map();

function makeKey(url, payload) {
	return `${url}|${stableStringify(payload)}`;
}

// options 支援：
//  - partial: boolean (若 true 且提供 options.original，則僅送出 diff)
//  - original: object (用於 partial diff)
//  - force: boolean (繞過 duplicate prevention)
//  - version / etag: value (會被加入 If-Match header 作為樂觀鎖定)
//  - onConflict: function(err, resp) 可選處理衝突回呼
function put(url, data = {}, options = {}) {
	const bypass = options.force === true;

	// 1) 處理 partial update
	let body = data;
	if (options.partial === true && options.original && typeof options.original === 'object') {
		const patch = diff(options.original, data);
		// 若沒任何改變可以直接回傳一個已完成的 promise 或拋錯，這裡回傳 null-style 結果
		if (typeof patch === 'object' && Object.keys(patch).length === 0) {
			return Promise.resolve({
				status: 204,
				headers: {},
				data: options.original,
				note: 'no-changes',
			});
		}
		body = patch;
	}

	// 2) duplicate prevention
	const key = makeKey(url, body);
	if (!bypass) {
		const existing = pendingMap.get(key);
		if (existing) return existing;
	}

	// 3) optimistic locking header
	const headers = Object.assign({}, options.headers || {});
	const version = options.version || options.etag;
	if (version) {
		// 使用 If-Match 作為 ETag 樂觀鎖定
		headers['If-Match'] = version;
	}

	// 建立實際的請求 promise，並放入 pendingMap
	const prom = HttpMain.put(url, body, Object.assign({}, options, { headers }))
		.then(res => {
			// 若回傳 header 中包含新的版本（ETag 或 X-Version），可回傳於 result.meta
			const meta = {};
			if (res && res.headers) {
				if (res.headers.etag) meta.etag = res.headers.etag;
				if (res.headers['x-version']) meta.version = res.headers['x-version'];
			}
			const final = Object.assign({}, res, { meta });
			pendingMap.delete(key);
			return final;
		})
		.catch(err => {
			pendingMap.delete(key);
			// 如果是衝突（412 Precondition Failed 或 409 Conflict），嘗試呼叫 onConflict 回呼
			const status = err && err.status;
			if ((status === 412 || status === 409) && typeof options.onConflict === 'function') {
				try {
					// onConflict 可以處理並回傳新的 Promise/值
					return Promise.resolve(options.onConflict(err)).then(r => r);
				} catch (cbErr) {
					// 若回呼本身拋錯，仍然拋出原始錯誤
					throw err;
				}
			}
			throw err;
		});

	pendingMap.set(key, prom);
	return prom;
}

module.exports = {
	put,
};