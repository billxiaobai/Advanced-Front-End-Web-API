const axios = require('axios');

let axiosInstance = axios.create();
const requestInterceptors = new Map();
const responseInterceptors = new Map();

// 全域設定物件
const globalConfig = {
    // GET 請求相關
    cache: {
        enabled: true,
        defaultTTL: 60000, // 預設快取時間 60s
    },
    
    // POST 相關
    post: {
        defaultDebounceMs: 1000,    // 預設防抖時間
        defaultThrottleMs: 5000,    // 預設節流時間
        preventDuplicate: true,     // 預設防止重複提交
    },
    
    // PUT 相關
    put: {
        preventDuplicate: true,     // 預設防止重複提交
        optimisticLock: true,       // 預設啟用樂觀鎖
    },
    
    // DELETE 相關
    delete: {
        preventDuplicate: true,     // 預設防止重複刪除
        toast: true,                // 預設顯示提示
        toastSeverity: 'warn',      // 預設提示級別
    },
    
    // 全域驗證器
    validators: new Map(),
    
    // 全域資料轉換器
    transformers: new Map()
};

function configure(options = {}) {
	// options: { baseURL, headers, timeout, ... }
	if (!axiosInstance) {
		axiosInstance = axios.create();
	}
	if (options.baseURL) axiosInstance.defaults.baseURL = options.baseURL;
	if (options.headers) axiosInstance.defaults.headers = Object.assign({}, axiosInstance.defaults.headers, options.headers);
	if (options.timeout) axiosInstance.defaults.timeout = options.timeout;
	// 可擴充其他預設
}

function getInstance() {
	if (!axiosInstance) {
		axiosInstance = axios.create();
	}
	return axiosInstance;
}

function addRequestInterceptor(onFulfilled, onRejected) {
	const id = getInstance().interceptors.request.use(onFulfilled, onRejected);
	requestInterceptors.set(id, true);
	return id;
}

function ejectRequestInterceptor(id) {
	if (requestInterceptors.has(id)) {
		getInstance().interceptors.request.eject(id);
		requestInterceptors.delete(id);
	}
}

function addResponseInterceptor(onFulfilled, onRejected) {
	const id = getInstance().interceptors.response.use(onFulfilled, onRejected);
	responseInterceptors.set(id, true);
	return id;
}

function ejectResponseInterceptor(id) {
	if (responseInterceptors.has(id)) {
		getInstance().interceptors.response.eject(id);
		responseInterceptors.delete(id);
	}
}

// 新增配置方法
function configureAdvanced(options = {}) {
    if (options.cache) Object.assign(globalConfig.cache, options.cache);
    if (options.post) Object.assign(globalConfig.post, options.post);
    if (options.put) Object.assign(globalConfig.put, options.put);
    if (options.delete) Object.assign(globalConfig.delete, options.delete);
}

// 新增驗證器管理
function addValidator(name, validatorFn) {
    globalConfig.validators.set(name, validatorFn);
}

function getValidator(name) {
    return globalConfig.validators.get(name);
}

// 新增轉換器管理
function addTransformer(name, transformFn) {
    globalConfig.transformers.set(name, transformFn);
}

function getTransformer(name) {
    return globalConfig.transformers.get(name);
}

// 取得全域設定
function getAdvancedConfig() {
    return { ...globalConfig };
}

// 新增記憶體管理
const clearCaches = () => {
    globalConfig.validators.clear();
    globalConfig.transformers.clear();
};

// 新增配置驗證
const validateConfig = (config) => {
    const required = ['baseURL'];
    const missing = required.filter(key => !config[key]);
    if (missing.length) {
        throw new Error(`Missing required config: ${missing.join(', ')}`);
    }
};

// 新增效能監控
const addPerformanceMonitor = () => {
    addRequestInterceptor(config => {
        config.metadata = { startTime: Date.now() };
        return config;
    });

    addResponseInterceptor(response => {
        const duration = Date.now() - response.config.metadata.startTime;
        console.debug(`Request to ${response.config.url} took ${duration}ms`);
        return response;
    });
};

module.exports = {
	configure,
	getInstance,
	addRequestInterceptor,
	ejectRequestInterceptor,
	addResponseInterceptor,
	ejectResponseInterceptor,
    configureAdvanced,
    addValidator,
    getValidator,
    addTransformer,
    getTransformer,
    getAdvancedConfig,
    clearCaches,
    validateConfig,
    addPerformanceMonitor
};