const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const HttpConfig = require('../Tool/Http/HttpConfig');

// 建立 mock axios 實例
function createMockAxios() {
    // 直接 mock HttpConfig 的 instance
    const instance = HttpConfig.getInstance();
    return new MockAdapter(instance);
}

// 清理 mock
function clearMocks(mock) {
    if (mock) {
        mock.reset();
        mock.restore();
    }
}

module.exports = {
    createMockAxios,
    clearMocks
};
