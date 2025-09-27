const Validator = require('../../Tool/FormState/Validator');

describe('Validator 基本規則', () => {
	test('required 與 pattern 與長度', async () => {
		let r = await Validator.validate('', { required: true });
		expect(r.valid).toBe(false);

		r = await Validator.validate('abc@example.com', { pattern: /@/ });
		expect(r.valid).toBe(true);

		r = await Validator.validate('ab', { minLength: 3 });
		expect(r.valid).toBe(false);

		r = await Validator.validate('abcd', { maxLength: 3 });
		expect(r.valid).toBe(false);
	});

	test('custom 同步規則與非同步規則', async () => {
		const syncRule = { custom: (v) => (v === 2 ? true : { valid: false, message: 'not two' }) };
		let res = await Validator.validate(2, syncRule);
		expect(res.valid).toBe(true);
		res = await Validator.validate(3, syncRule);
		expect(res.valid).toBe(false);

		const asyncRule = { custom: async (v) => { await new Promise(r => setTimeout(r, 10)); return v === 'ok' ? true : { valid: false }; } };
		res = await Validator.validate('ok', asyncRule);
		expect(res.valid).toBe(true);
		res = await Validator.validate('no', asyncRule);
		expect(res.valid).toBe(false);
	});

	test('registerRule 與字串引用', async () => {
		Validator.registerRule('isEven', (v) => (v % 2 === 0 ? true : { valid: false, message: 'must be even' }));
		const r = await Validator.validate(3, 'isEven');
		expect(r.valid).toBe(false);
		const r2 = await Validator.validate(4, 'isEven');
		expect(r2.valid).toBe(true);
	});
});
