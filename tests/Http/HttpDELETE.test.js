const HttpConfig = require('../../Tool/Http/HttpConfig');
const HttpDELETE = require('../../Tool/Http/HttpDELETE');
const { createMockAxios, clearMocks } = require('../testUtils');

describe('HttpDELETE', () => {
    let mockAxios;
    let consoleWarn;

    beforeAll(() => {
        HttpConfig.configure({
            baseURL: 'http://api.test.com'
        });
        consoleWarn = console.warn;
    });

    beforeEach(() => {
        mockAxios = createMockAxios();
        console.warn = jest.fn();
    });

    afterEach(() => {
        clearMocks(mockAxios);
        console.warn = consoleWarn;
    });

    describe('delete', () => {
        it('應該清理查詢參數', async () => {
            const url = '/test';
            const params = { id: 1, filter: '  ', sort: null };
            
            // 設定成功回應
            mockAxios.onDelete('http://api.test.com/test').reply(config => {
                return [200, { success: true }];
            });
            
            const result = await HttpDELETE.delete(url, params);
            expect(result.status).toBe(200);
            expect(mockAxios.history.delete[0].params)
                .toEqual({ id: 1 });
        });

        it('應該支援提示功能', async () => {
            const url = '/test';
            let toastMessage = '';
            
            mockAxios.onDelete('http://api.test.com/test').reply(404, {
                error: 'Not Found'
            });
            
            try {
                await HttpDELETE.delete(url, {}, {
                    toast: true,
                    onToast: (msg) => {
                        toastMessage = msg;
                    }
                });
            } catch (error) {
                expect(toastMessage).toContain('Delete failed');
            }
        });
    });
});