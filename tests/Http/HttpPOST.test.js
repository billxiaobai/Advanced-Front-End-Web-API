const HttpConfig = require('../../Tool/Http/HttpConfig');
const HttpPOST = require('../../Tool/Http/HttpPOST');
const { createMockAxios, clearMocks } = require('../testUtils');

describe('HttpPOST', () => {
    let mockAxios;

    beforeAll(() => {
        HttpConfig.configure({
            baseURL: 'http://api.test.com'
        });
    });

    beforeEach(() => {
        mockAxios = createMockAxios();
    });

    afterEach(() => {
        clearMocks(mockAxios);
    });

    describe('post', () => {
        it('應該清理並填充預設值', async () => {
            const url = '/test';
            const data = { name: '  test  ', age: null };
            const defaults = { age: 20, type: 'user' };
            
            mockAxios.onPost(url).reply(200, { success: true });
            
            const result = await HttpPOST.post(url, data, { defaults });
            const sentData = JSON.parse(mockAxios.history.post[0].data);
            expect(sentData).toMatchObject({
                name: 'test',
                age: 20,
                type: 'user'
            });
        });

        it('應該支援防抖', async () => {
            const url = '/test';
            const response = { success: true };
            
            mockAxios.onPost('http://api.test.com/test').reply(200, response);
            
            // 等待函數
            const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
            
            // 快速連續發送兩個請求
            const promises = [
                HttpPOST.post(url, { id: 1 }, { debounceMs: 100 }),
                HttpPOST.post(url, { id: 2 }, { debounceMs: 100 })
            ];
            
            // 等待所有請求完成
            const results = await Promise.all(promises);
            
            // 等待確保 debounce 計時器觸發
            await wait(150);
            
            // 驗證只發送一次請求
            expect(mockAxios.history.post.length).toBe(1);
            // 驗證兩個 promise 都得到相同結果
            expect(results[0]).toEqual(results[1]);
        });
    });
});
