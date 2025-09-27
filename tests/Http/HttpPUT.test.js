const HttpConfig = require('../../Tool/Http/HttpConfig');
const HttpPUT = require('../../Tool/Http/HttpPUT');
const { createMockAxios, clearMocks } = require('../testUtils');

describe('HttpPUT', () => {
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

    describe('put', () => {
        it('應該支援差異更新', async () => {
            const url = '/test/1';
            const original = { name: 'test', age: 20 };
            const updated = { name: 'test', age: 25 };
            
            mockAxios.onPut(url).reply(200, updated);
            
            const result = await HttpPUT.put(url, updated, {
                partial: true,
                original
            });
            
            expect(JSON.parse(mockAxios.history.put[0].data))
                .toEqual({ age: 25 });
        });

        it('應該處理樂觀鎖定衝突', async () => {
            const url = '/test/1';
            const data = { name: 'test' };
            const version = 'v1';
            
            mockAxios.onPut(url).reply(412);
            
            let conflictCalled = false;
            await expect(HttpPUT.put(url, data, {
                version,
                onConflict: () => {
                    conflictCalled = true;
                    return Promise.resolve({ status: 200, data: { updated: true } });
                }
            })).resolves.toEqual({ status: 200, data: { updated: true } });
            
            expect(conflictCalled).toBe(true);
            expect(mockAxios.history.put[0].headers['If-Match']).toBe(version);
        });
    });
});
