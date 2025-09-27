// 共用工具函式
const stableStringify = (obj) => {
    if (obj === null) return 'null';
    if (typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(obj).sort().map(k => 
        `${JSON.stringify(k)}:${stableStringify(obj[k])}`
    ).join(',') + '}';
};

const cleanInput = (input) => {
    if (input == null) return undefined;
    if (typeof input === 'string') return input.trim() || undefined;
    if (Array.isArray(input)) {
        const arr = input.map(cleanInput).filter(v => v !== undefined);
        return arr.length ? arr : undefined;
    }
    if (typeof input === 'object') {
        const out = {};
        Object.entries(input).forEach(([k, v]) => {
            const cv = cleanInput(v);
            if (cv !== undefined) out[k] = cv;
        });
        return Object.keys(out).length ? out : undefined;
    }
    return input;
};

// 新增：整合 Toast 並提供 httpRequest helper
const Toast = require('../Toast/ToastAPI'); // 相對路徑到 Tool/Toast/ToastAPI.js

/**
 * httpRequest(url, options)
 * - options: fetch options plus:
 *    - showToastOnError (default true)
 *    - toastOptions (object passed to Toast)
 *    - showSuccess (boolean) 顯示成功 toast
 *    - successMessage (string) 成功時的訊息
 */
async function httpRequest(url, options = {}) {
    const {
        showToastOnError = true,
        toastOptions = {},
        showSuccess = false,
        successMessage,
        ...fetchOpts
    } = options;

    if (typeof fetch !== 'function') {
        const err = new Error('fetch not available in this environment');
        if (showToastOnError) Toast.error(err.message, Object.assign({ duration: 5000 }, toastOptions));
        return Promise.reject(err);
    }

    // 清理並準備 body（若為物件則序列化）
    try {
        if ('body' in fetchOpts) {
            const cleaned = cleanInput(fetchOpts.body);
            if (cleaned === undefined) {
                delete fetchOpts.body;
            } else if (typeof cleaned === 'object' && !(cleaned instanceof FormData)) {
                fetchOpts.body = JSON.stringify(cleaned);
                fetchOpts.headers = Object.assign({ 'Content-Type': 'application/json' }, fetchOpts.headers || {});
            } else {
                fetchOpts.body = cleaned;
            }
        }
    } catch (e) {
        // 仍嘗試發送，但記錄錯誤並顯示通知
        if (showToastOnError) Toast.error('Request preparation failed', Object.assign({ duration: 5000 }, toastOptions));
        return Promise.reject(e);
    }

    try {
        const res = await fetch(url, fetchOpts);
        const text = await res.text();
        let data;
        try { data = text ? JSON.parse(text) : undefined; } catch (e) { data = text; }

        if (!res.ok) {
            const message = (data && typeof data === 'object' && data.message) ? data.message :
                `Request failed: ${res.status} ${res.statusText}`;
            if (showToastOnError) Toast.error(message, Object.assign({ duration: 5000 }, toastOptions));
            const err = new Error(message);
            err.status = res.status;
            err.body = data;
            throw err;
        }

        if (showSuccess) {
            Toast.success(successMessage || 'Request succeeded', toastOptions);
        }

        return data;
    } catch (err) {
        if (showToastOnError) {
            Toast.error(err.message || 'Network error', Object.assign({ duration: 5000 }, toastOptions));
        }
        throw err;
    }
}

module.exports = {
    stableStringify,
    cleanInput,
    httpRequest
};
