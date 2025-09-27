const { stableStringify, cleanInput } = require('../../Tool/Http/HttpUtils');

describe('HttpUtils', () => {
  describe('stableStringify', () => {
    it('應該產生穩定的字串，不受物件屬性順序影響', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 2, a: 1 };
      expect(stableStringify(obj1)).toBe(stableStringify(obj2));
    });

    it('應該正確處理巢狀物件', () => {
      const obj = { a: { c: 3, b: 2 }, d: 1 };
      expect(stableStringify(obj)).toBe('{"a":{"b":2,"c":3},"d":1}');
    });
  });

  describe('cleanInput', () => {
    it('應該移除空值', () => {
      const input = {
        a: '',
        b: '  ',
        c: 'valid',
        d: null,
        e: undefined
      };
      expect(cleanInput(input)).toEqual({ c: 'valid' });
    });

    it('應該處理巢狀物件', () => {
      const input = {
        a: { b: '', c: 'valid' },
        d: { e: '  ', f: null }
      };
      expect(cleanInput(input)).toEqual({ a: { c: 'valid' } });
    });
  });
});
