const HttpConfig = require('../../Tool/Http/HttpConfig');
const HttpGET = require('../../Tool/Http/HttpGET');
const { createMockAxios, clearMocks } = require('../testUtils');

describe('HttpGET', () => {
    let mockAxios;

    beforeAll(() => {
        HttpConfig.configure({
            baseURL: 'http://api.test.com'
        });
    });

    beforeEach(() => {
        mockAxios = createMockAxios();
        // 清理快取
        HttpGET.clearCache && HttpGET.clearCache();
    });

    afterEach(() => {
        clearMocks(mockAxios);
    });

    describe('get', () => {
        it('應該支援快取機制', async () => {
            const testUrl = '/test';
            const fullUrl = 'http://api.test.com/test';
            const responseData = { id: 1 };
            
            mockAxios.onGet(fullUrl).reply(200, responseData);

            // 第一次呼叫
            const result1 = await HttpGET.get(testUrl);
            expect(result1.data).toEqual(responseData);
            
            // 第二次呼叫應該使用快取
            const result2 = await HttpGET.get(testUrl);
            expect(result2.cached).toBe(true);
            expect(result2.data).toEqual(responseData);
        });

        it('應該支援資料驗證', async () => {
            const testUrl = '/test';
            const fullUrl = 'http://api.test.com/test';
            const responseData = { id: 1, name: 'test' };
            
            mockAxios.onGet(fullUrl).reply(200, responseData);

            const validate = data => data && data.id === 1;
            
            const result = await HttpGET.get(testUrl, {}, { 
                validate,
                force: true // 強制略過快取
            });
            expect(result.data).toEqual(responseData);
        });

        it('驗證失敗時應該拋出錯誤', async () => {
            const testUrl = '/test';
            const fullUrl = 'http://api.test.com/test';
            const responseData = { id: 2 }; // 不符合驗證條件
            
            mockAxios.onGet(fullUrl).reply(200, responseData);

            const validate = data => data.id === 1;
            
            await expect(HttpGET.get(testUrl, {}, { 
                validate,
                force: true // 強制略過快取
            })).rejects.toThrow('Response validation failed');
        });
    });
});
