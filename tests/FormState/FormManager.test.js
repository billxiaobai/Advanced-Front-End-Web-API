const FormManager = require('../../Tool/FormState/FormManager');
const FormAPI = require('../../Tool/FormState/FormAPI');

describe('FormManager / FormAPI 基本行為', () => {
	beforeEach(() => {
		// 清空單例狀態
		try { FormManager.destroyForm('test'); } catch (e) {}
		FormManager.forms.clear();
		FormManager._initial.clear();
		FormManager._subs.clear();
		FormManager._controllers.clear();
	});

	test('建立表單並取得初始值與狀態', () => {
		const f = FormAPI.createForm('test', { name: 'alice' }, { validators: { name: { required: true } } });
		expect(f).toBeTruthy();
		expect(FormAPI.getValues('test')).toEqual({ name: 'alice' });
		expect(FormAPI.isDirty('test')).toBe(false);
		expect(FormAPI.isValid('test')).toBe(true); // 尚未驗證 errors 為空
	});

	test('setFieldValue / validateField / validateAll 與錯誤回寫', async () => {
		FormAPI.createForm('test', { name: '' }, { validators: { name: { required: true } } });
		// 先驗證會觸發 error
		let res = await FormAPI.validateField('test', 'name');
		expect(res.valid).toBe(false);
		expect(FormAPI.getErrors('test')).toHaveProperty('name');

		// 更新欄位並驗證成功
		FormAPI.setFieldValue('test', 'name', 'bob');
		res = await FormAPI.validateField('test', 'name');
		expect(res.valid).toBe(true);
		expect(FormAPI.getErrors('test')).not.toHaveProperty('name');

		// validateAll
		const all = await FormAPI.validateAll('test');
		expect(all.valid).toBe(true);
	});

	test('submit 成功與失敗情況', async () => {
		FormAPI.createForm('test', { age: 10 }, {
			validators: { age: (v) => v >= 18 ? { valid: true } : { valid: false, message: 'too young' } },
			onSubmit: async (values) => {
				return { ok: true, values };
			}
		});
		// submit 應會因驗證失敗而 reject
		await expect(FormAPI.submit('test')).rejects.toMatchObject({ valid: false });
		// 修正值使之通過
		FormAPI.setFieldValue('test', 'age', 20);
		await expect(FormAPI.submit('test')).resolves.toMatchObject({ valid: true });
	});

	test('subscribe 可接收狀態更新', async () => {
		FormAPI.createForm('test', { email: '' }, { validators: { email: { pattern: /@/, message: 'invalid' } } });
		const snapshots = [];
		const unsub = FormAPI.subscribe('test', (s) => snapshots.push(s));
		expect(typeof unsub).toBe('function');
		FormAPI.setFieldValue('test', 'email', 'a@b.com');
		// 等待微任務
		await Promise.resolve();
		expect(snapshots.length).toBeGreaterThan(0);
		// 驗證後 snapshot 應反映 errors 清除
		await FormAPI.validateField('test', 'email');
		expect(snapshots[snapshots.length - 1].errors).toEqual({});
		unsub();
	});

	test('resetToInitial 與 isDirty', () => {
		FormAPI.createForm('test', { t: 1 }, {});
		FormAPI.setFieldValue('test', 't', 2);
		expect(FormAPI.isDirty('test')).toBe(true);
		FormAPI.resetToInitial('test');
		expect(FormAPI.isDirty('test')).toBe(false);
	});
});
