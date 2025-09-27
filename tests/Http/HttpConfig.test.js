const HttpConfig = require('../../Tool/Http/HttpConfig');
const { createMockAxios, clearMocks } = require('../testUtils');

describe('HttpConfig', () => {
  let mockAxios;

  beforeEach(() => {
    mockAxios = createMockAxios();
  });

  afterEach(() => {
    clearMocks(mockAxios);
  });

  describe('configure', () => {
    it('應該正確設定 baseURL', () => {
      const baseURL = 'http://api.test.com';
      HttpConfig.configure({ baseURL });
      expect(HttpConfig.getInstance().defaults.baseURL).toBe(baseURL);
    });

    it('應該合併 headers', () => {
      const headers = { 'X-Custom': 'test' };
      HttpConfig.configure({ headers });
      expect(HttpConfig.getInstance().defaults.headers['X-Custom']).toBe('test');
    });
  });

  describe('攔截器', () => {
    it('應該可以加入並移除請求攔截器', () => {
      const interceptor = config => config;
      const id = HttpConfig.addRequestInterceptor(interceptor);
      expect(typeof id).toBe('number');
      HttpConfig.ejectRequestInterceptor(id);
    });

    it('應該可以加入並移除回應攔截器', () => {
      const interceptor = response => response;
      const id = HttpConfig.addResponseInterceptor(interceptor);
      expect(typeof id).toBe('number');
      HttpConfig.ejectResponseInterceptor(id);
    });
  });
});
