const HttpMain = require('./HttpMain');
const { stableStringify, cleanInput } = require('./HttpUtils');

// 簡單 in-memory cache: key -> { value, expiresAt }
const cache = new Map();

// options:
//  - cache: boolean (default true)
//  - cacheTTL: ms (default 60000)
//  - force: boolean (bypass cache and refresh)
//  - validate: function(data) => boolean | transformedData (若回傳 false 或 throw 則視為驗證失敗)
//  - transform: function(data) => transformedData
async function get(url, params = {}, options = {}) {
	// 1) preprocess params
	const clean = cleanInput(params) || {};

	// 2) cache handling
	const useCache = options.cache !== false;
	const ttl = typeof options.cacheTTL === 'number' ? options.cacheTTL : 60000; // default 60s
	const key = `${url}|${stableStringify(clean)}`;

	if (useCache && !options.force) {
		const entry = cache.get(key);
		if (entry && entry.expiresAt > Date.now()) {
			// 回傳快取（與 coreResponse 結構一致，並加上 cached 標記）
			return Object.assign({}, entry.value, { cached: true });
		}
		// 若過期則刪除
		if (entry) cache.delete(key);
	}

	// 3) 發出實際請求
	const resp = await HttpMain.get(url, clean, options);

	// 4) validate / transform
	let data = resp.data;
	if (typeof options.validate === 'function') {
		// validate 只接受 boolean 回傳值
		const isValid = options.validate(data);
		if (!isValid) {
			const err = new Error('Response validation failed');
			err.response = resp;
			throw err;
		}
	}
	if (typeof options.transform === 'function') {
		data = options.transform(data);
	}

	const finalResp = {
		status: resp.status,
		headers: resp.headers,
		data,
	};

	// 5) 寫入快取（僅對成功回應）
	if (useCache && resp && resp.status >= 200 && resp.status < 300) {
		cache.set(key, {
			value: finalResp,
			expiresAt: Date.now() + ttl,
		});
	}

	return finalResp;
}

// 新增清理快取方法
function clearCache() {
    cache.clear();
}

module.exports = {
	get,
	clearCache
};