const FormManager = require('./FormManager');

class Binder {
	constructor() {
		this.bindings = new Map(); // key -> { formId, field, el, handlers, createdErrorNode }
	}
	_bindElEvents(formId, field, el) {
		const key = `${formId}::${field}::${Binder._getElId(el)}`;
		// 若已綁定，先移除
		if (this.bindings.has(key)) return;
		const onInput = (e) => {
			const val = Binder._readValue(el);
			FormManager.setFieldValue(formId, field, val, { touched: true, validate: false });
			// optionally validate on change if form meta enabled
			const f = FormManager.getForm(formId);
			if (f && f.meta && f.meta.validateOnChange) {
				FormManager.validateField(formId, field).then(() => {
					this._applyErrorToDom(formId, field, el);
				});
			} else {
				this._applyErrorToDom(formId, field, el);
			}
		};
		const onBlur = (e) => {
			FormManager.setFieldValue(formId, field, Binder._readValue(el), { touched: true });
			FormManager.validateField(formId, field).then(() => {
				this._applyErrorToDom(formId, field, el);
			});
		};
		el.addEventListener('input', onInput);
		el.addEventListener('change', onInput);
		el.addEventListener('blur', onBlur);
		this.bindings.set(key, { formId, field, el, handlers: { onInput, onBlur }, createdErrorNode: null });
		// initial apply existing value
		const f = FormManager.getForm(formId);
		if (f && f.values && Binder._getByPath(f.values, field) !== undefined) {
			Binder._writeValue(el, Binder._getByPath(f.values, field));
		}
	}
	// 新增：private helper 以支援 path 讀取（避免重複）
	static _getByPath(obj, path) {
		return FormManager._getByPath ? FormManager._getByPath(obj, path) : undefined;
	}
	bind(formId, elOrSelector, field) {
		if (!formId || !field) throw new Error('formId and field required');
		const els = (typeof elOrSelector === 'string') ? Array.from(document.querySelectorAll(elOrSelector)) : (elOrSelector instanceof Element ? [elOrSelector] : []);
		if (!els.length) return false;
		for (const el of els) {
			this._bindElEvents(formId, field, el);
			// apply initial error if any
			this._applyErrorToDom(formId, field, el);
		}
		return true;
	}
	unbind(formId, elOrSelector, field) {
		const els = (typeof elOrSelector === 'string') ? Array.from(document.querySelectorAll(elOrSelector)) : (elOrSelector instanceof Element ? [elOrSelector] : []);
		for (const el of els) {
			const key = `${formId}::${field}::${Binder._getElId(el)}`;
			const entry = this.bindings.get(key);
			if (entry) {
				const { handlers, createdErrorNode } = entry;
				try {
					el.removeEventListener('input', handlers.onInput);
					el.removeEventListener('change', handlers.onInput);
					el.removeEventListener('blur', handlers.onBlur);
				} catch (e) {}
				// 若 Binder 建立了錯誤節點，移除它
				if (createdErrorNode && createdErrorNode.parentNode) {
					try { createdErrorNode.parentNode.removeChild(createdErrorNode); } catch (e) {}
				}
				// 若有 aria-describedby reference，嘗試移除
				const described = el.getAttribute && el.getAttribute('aria-describedby');
				if (described && createdErrorNode && createdErrorNode.id === described) {
					el.removeAttribute('aria-describedby');
				}
				this.bindings.delete(key);
			}
		}
	}
	_applyErrorToDom(formId, field, el) {
		const errs = FormManager.getErrors(formId) || {};
		const msg = errs[field];
		// try to find an element referenced by data-error-target attribute on input
		const targetSel = el.getAttribute && el.getAttribute('data-error-target');
		let target = null;
		if (targetSel) {
			target = document.querySelector(targetSel);
		}
		// if no explicit target, look for sibling .form-error
		if (!target) {
			let sib = el.nextElementSibling;
			while (sib) {
				if (sib.classList && sib.classList.contains('form-error')) { target = sib; break; }
				sib = sib.nextElementSibling;
			}
		}
		// if still no target, create small node after el (once)
		let created = null;
		if (!target) {
			const existing = el.nextElementSibling && el.nextElementSibling.classList && el.nextElementSibling.classList.contains('form-error') ? el.nextElementSibling : null;
			if (existing) target = existing;
			else {
				target = document.createElement('div');
				target.className = 'form-error';
				target.style.color = '#c0392b';
				target.style.fontSize = '12px';
				target.style.marginTop = '4px';
				// 給予 id 以便 aria-describedby
				target.id = `formerr-${Math.random().toString(36).slice(2,9)}`;
				try { el.parentNode.insertBefore(target, el.nextSibling); } catch (e) {}
				created = target;
			}
		}
		if (target) {
			if (msg) {
				target.textContent = String(msg);
				target.style.display = '';
				el.setAttribute('aria-invalid', 'true');
				// link aria-describedby
				if (!el.getAttribute('aria-describedby')) el.setAttribute('aria-describedby', target.id);
			} else {
				target.textContent = '';
				target.style.display = 'none';
				el.removeAttribute('aria-invalid');
				// 若是 binder 創建並且隱藏，保留 node but remove aria-describedby
				if (created && el.getAttribute('aria-describedby') === target.id) el.removeAttribute('aria-describedby');
			}
		}
		// 記錄 created node 以利 unbind 清理
		const key = `${formId}::${field}::${Binder._getElId(el)}`;
		const entry = this.bindings.get(key);
		if (entry && created) entry.createdErrorNode = created;
	}
	static _getElId(el) {
		if (!el._binderId) el._binderId = `b${Math.random().toString(36).slice(2,9)}`;
		return el._binderId;
	}
	static _readValue(el) {
		if (!el) return undefined;
		const tag = el.tagName && el.tagName.toLowerCase();
		if (tag === 'input') {
			const type = el.type;
			if (type === 'checkbox') return !!el.checked;
			if (type === 'radio') {
				const form = el.form || document;
				const checked = form.querySelector(`input[name="${el.name}"]:checked`);
				return checked ? checked.value : undefined;
			}
			return el.value;
		}
		if (tag === 'select') return el.value;
		if (tag === 'textarea') return el.value;
		return el.getAttribute && el.getAttribute('data-value');
	}
	static _writeValue(el, value) {
		if (!el) return;
		const tag = el.tagName && el.tagName.toLowerCase();
		if (tag === 'input') {
			const type = el.type;
			if (type === 'checkbox') { el.checked = !!value; return; }
			if (type === 'radio') { el.checked = (String(el.value) === String(value)); return; }
			el.value = value == null ? '' : value;
			return;
		}
		if (tag === 'select' || tag === 'textarea') { el.value = value == null ? '' : value; return; }
		if (el.setAttribute) el.setAttribute('data-value', String(value));
	}
}

module.exports = new Binder();
