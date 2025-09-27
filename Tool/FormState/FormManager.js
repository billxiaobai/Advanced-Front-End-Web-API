// 建立表單狀態管理，支援多個表單的欄位值、錯誤、驗證與提交生命週期管理
const Validator = require('./Validator');

class FormManager {
	constructor() {
		this.forms = new Map(); // id -> { values, errors, touched, validators, submitting, meta }
		// 新增：保存初始快照以便 resetToInitial
		this._initial = new Map(); // id -> initial values
		// 新增：訂閱者（state change callbacks）
		this._subs = new Map(); // id -> Set(fn)
		// 用於 submit 中的 AbortController
		this._controllers = new Map(); // id -> AbortController
	}
	// 新增：深層 get/set 支援 dot/array path
	static _getByPath(obj, path) {
		if (!path) return undefined;
		const parts = String(path).replace(/\[(\w+)\]/g, '.$1').split('.').filter(Boolean);
		let cur = obj;
		for (const p of parts) {
			if (cur == null) return undefined;
			cur = cur[p];
		}
		return cur;
	}
	static _setByPath(obj, path, val) {
		const parts = String(path).replace(/\[(\w+)\]/g, '.$1').split('.').filter(Boolean);
		let cur = obj;
		for (let i = 0; i < parts.length - 1; i++) {
			const p = parts[i];
			if (cur[p] == null) cur[p] = {};
			cur = cur[p];
		}
		cur[parts[parts.length - 1]] = val;
	}
	createForm(id, initialValues = {}, options = {}) {
		if (!id) throw new Error('form id required');
		const form = {
			values: Object.assign({}, initialValues),
			errors: {},
			touched: {},
			validators: options.validators || {}, // field -> rules
			submitting: false,
			meta: Object.assign({ validateOnBlur: true, validateOnChange: false }, options.meta || {}),
			_onSubmit: options.onSubmit || null,
			formError: null
		};
		this.forms.set(id, form);
		this._initial.set(id, JSON.parse(JSON.stringify(initialValues || {})));
		this._subs.set(id, new Set());
		return form;
	}
	// 新增：訂閱狀態變化 (cb(formState)) 回傳 unsubscribe
	subscribe(id, cb) {
		if (!this._subs.has(id)) this._subs.set(id, new Set());
		const set = this._subs.get(id);
		set.add(cb);
		// 回傳 unsubscribe
		return () => set.delete(cb);
	}
	_notify(id) {
		const form = this.getForm(id);
		if (!form) return;
		const set = this._subs.get(id);
		if (!set) return;
		const snapshot = {
			values: Object.assign({}, form.values),
			errors: Object.assign({}, form.errors),
			touched: Object.assign({}, form.touched),
			submitting: !!form.submitting,
			formError: form.formError,
			meta: Object.assign({}, form.meta)
		};
		for (const cb of Array.from(set)) {
			try { cb(snapshot); } catch (e) { /* ignore */ }
		}
	}
	getForm(id) {
		return this.forms.get(id);
	}
	destroyForm(id) {
		// 取消任何進行中的 submit
		try { const c = this._controllers.get(id); if (c) c.abort(); } catch (e) {}
		this._controllers.delete(id);
		this._initial.delete(id);
		this._subs.delete(id);
		return this.forms.delete(id);
	}
	resetForm(id, values = undefined) {
		const f = this.getForm(id);
		if (!f) return false;
		const base = (values === undefined) ? (this._initial.get(id) || {}) : values;
		f.values = Object.assign({}, base);
		f.errors = {};
		f.touched = {};
		f.formError = null;
		this._notify(id);
		return true;
	}
	// 新增：reset to initial snapshot
	resetToInitial(id) {
		const init = this._initial.get(id);
		return this.resetForm(id, init || {});
	}
	setValidators(id, validators = {}) {
		const f = this.getForm(id);
		if (!f) return false;
		f.validators = Object.assign({}, f.validators, validators);
		this._notify(id);
		return true;
	}
	// 新增: 設定單欄位值（支援路徑），並可選擇是否觸發驗證/通知
	setFieldValue(id, field, value, opts = {}) {
		const f = this.getForm(id);
		if (!f) return false;
		FormManager._setByPath(f.values, field, value);
		if (opts.touched) this.setFieldTouched(id, field, true);
		if (f.meta.validateOnChange || opts.validate) {
			this.validateField(id, field).then(() => this._notify(id));
		} else {
			this._notify(id);
		}
		return true;
	}
	// 新增: 設定欄位錯誤（可由程式設置）
	setFieldError(id, field, message) {
		const f = this.getForm(id);
		if (!f) return false;
		if (message) f.errors[field] = message;
		else delete f.errors[field];
		this._notify(id);
		return true;
	}
	setFieldTouched(id, field, touched = true) {
		const f = this.getForm(id);
		if (!f) return false;
		if (touched) f.touched[field] = true;
		else delete f.touched[field];
		this._notify(id);
		return true;
	}
	setFormError(id, message) {
		const f = this.getForm(id);
		if (!f) return false;
		f.formError = message || null;
		this._notify(id);
		return true;
	}
	setSubmitting(id, submitting = true) {
		const f = this.getForm(id);
		if (!f) return false;
		f.submitting = !!submitting;
		this._notify(id);
		return true;
	}
	updateField(id, field, value, opts = {}) {
		// 舊有行為改為呼叫 setFieldValue
		return this.setFieldValue(id, field, value, opts);
	}
	async validateField(id, field) {
		const f = this.getForm(id);
		if (!f) return { field, valid: true };
		const rules = f.validators[field];
		if (!rules) {
			delete f.errors[field];
			this._notify(id);
			return { field, valid: true };
		}
		try {
			// 支援 Validator.validate 回傳 {valid,message}
			const val = FormManager._getByPath(f.values, field);
			const res = await Validator.validate(val, rules, { values: f.values, field });
			if (res.valid) delete f.errors[field];
			else f.errors[field] = res.message || 'Invalid';
			this._notify(id);
			return { field, valid: res.valid, message: res.message };
		} catch (e) {
			f.errors[field] = e.message || 'Validation error';
			this._notify(id);
			return { field, valid: false, message: f.errors[field] };
		}
	}
	async validateAll(id) {
		const f = this.getForm(id);
		if (!f) return { valid: true, errors: {} };
		const fields = Object.keys(f.validators || {});
		const results = await Promise.all(fields.map(fn => this.validateField(id, fn)));
		const valid = results.every(r => r.valid);
		return { valid, errors: Object.assign({}, f.errors) };
	}
	// 新增：是否 dirty（與初始值比較）
	isDirty(id) {
		const f = this.getForm(id);
		const init = this._initial.get(id) || {};
		// shallow check of keys
		const vals = f ? f.values : {};
		return JSON.stringify(vals) !== JSON.stringify(init);
	}
	// 新增：是否驗證通過（同步快取檢查 errors)
	isValid(id) {
		const f = this.getForm(id);
		if (!f) return true;
		return Object.keys(f.errors || {}).length === 0;
	}
	async submit(id, submitHandler) {
		const f = this.getForm(id);
		if (!f) throw new Error('form not found');
		// abort previous submit if any
		try { const prev = this._controllers.get(id); if (prev) prev.abort(); } catch (e) {}
		const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
		if (controller) this._controllers.set(id, controller);
		f.submitting = true;
		this._notify(id);
		const { valid, errors } = await this.validateAll(id);
		if (!valid) {
			f.submitting = false;
			this._controllers.delete(id);
			this._notify(id);
			return Promise.reject({ valid: false, errors });
		}
		const handler = submitHandler || f._onSubmit;
		if (typeof handler !== 'function') {
			f.submitting = false;
			this._controllers.delete(id);
			this._notify(id);
			return Promise.resolve({ valid: true, values: f.values });
		}
		try {
			const result = await handler(Object.assign({}, f.values), { formId: id, signal: controller ? controller.signal : undefined });
			f.submitting = false;
			this._controllers.delete(id);
			this._notify(id);
			return Promise.resolve({ valid: true, values: f.values, result });
		} catch (e) {
			f.submitting = false;
			this._controllers.delete(id);
			// 若 handler 拋出特定 form error 物件，可設定 form.formError
			if (e && e.formError) f.formError = e.formError;
			this._notify(id);
			return Promise.reject(e);
		}
	}
	getValues(id) {
		const f = this.getForm(id);
		return f ? Object.assign({}, f.values) : null;
	}
	getErrors(id) {
		const f = this.getForm(id);
		return f ? Object.assign({}, f.errors) : null;
	}
	getMeta(id) {
		const f = this.getForm(id);
		if (!f) return null;
		return {
			submitting: !!f.submitting,
			touched: Object.assign({}, f.touched),
			formError: f.formError,
			meta: Object.assign({}, f.meta)
		};
	}
}

module.exports = new FormManager();