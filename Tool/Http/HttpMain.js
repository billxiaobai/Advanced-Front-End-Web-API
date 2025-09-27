const HttpConfig = require('./HttpConfig');
const HttpGET = require('./HttpGET');
const HttpPOST = require('./HttpPOST');
const HttpPUT = require('./HttpPUT');
const HttpDELETE = require('./HttpDELETE');

// 新增統一錯誤處理
class HttpError extends Error {
    constructor(message, status, data, headers) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.data = data;
        this.headers = headers;
    }
}

// 優化 coreRequest
async function coreRequest(method, url, options = {}) {
    const config = Object.assign({}, 
        options.axiosConfig || {}, 
        {
            method,
            url,
            params: options.params,
            data: options.data,
            headers: options.headers,
            // 新增重試機制
            retry: options.retry || 0,
            retryDelay: options.retryDelay || 1000,
        }
    );

    try {
        const resp = await HttpConfig.getInstance().request(config);
        return {
            status: resp.status,
            headers: resp.headers,
            data: resp.data,
        };
    } catch (err) {
        if (err.response) {
            throw new HttpError(
                `Request failed with status ${err.response.status}`,
                err.response.status,
                err.response.data,
                err.response.headers
            );
        }
        throw err;
    }
}

function get(url, params = {}, options = {}) {
	return coreRequest('get', url, Object.assign({}, options, { params }));
}

function post(url, data = {}, options = {}) {
	return coreRequest('post', url, Object.assign({}, options, { data }));
}

function put(url, data = {}, options = {}) {
	return coreRequest('put', url, Object.assign({}, options, { data }));
}

function del(url, params = {}, options = {}) {
	return coreRequest('delete', url, Object.assign({}, options, { params }));
}

module.exports = {
	coreRequest,
	get,
	post,
	put,
	delete: del,
	advancedGet: HttpGET.get,
	advancedPost: HttpPOST.post,
	advancedPut: HttpPUT.put,
	advancedDelete: HttpDELETE.delete,
	HttpError,
};