// 簡單驗證引擎，支援 rules 為物件或陣列
const defaultMessages = {
	required: 'This field is required',
	pattern: 'Invalid format',
	minLength: 'Too short',
	maxLength: 'Too long'
};

const _registered = {}; // name -> fn or rule object

function registerRule(name, fnOrRule) {
	if (!name) throw new Error('rule name required');
	_registered[name] = fnOrRule;
}

// existing helpers
function isEmpty(val) {
	return val === undefined || val === null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);
}

async function runRule(value, rule, context) {
	// 支援 string rule reference
	if (typeof rule === 'string') {
		const ref = _registered[rule];
		if (!ref) return { valid: true };
		rule = ref;
	}
	// rule can be function or object (existing logic)
	if (typeof rule === 'function') {
		const r = rule(value, context);
		return (r && typeof r.then === 'function') ? await r : r;
	}
	if (typeof rule === 'object') {
		if (rule.required) {
			const ok = !isEmpty(value);
			return ok ? { valid: true } : { valid: false, message: rule.message || defaultMessages.required };
		}
		if (rule.pattern) {
			const re = rule.pattern instanceof RegExp ? rule.pattern : new RegExp(rule.pattern);
			const ok = (typeof value === 'string') && re.test(value);
			return ok ? { valid: true } : { valid: false, message: rule.message || defaultMessages.pattern };
		}
		if (rule.minLength !== undefined) {
			const ok = (typeof value === 'string' || Array.isArray(value)) && value.length >= rule.minLength;
			return ok ? { valid: true } : { valid: false, message: rule.message || defaultMessages.minLength };
		}
		if (rule.maxLength !== undefined) {
			const ok = (typeof value === 'string' || Array.isArray(value)) && value.length <= rule.maxLength;
			return ok ? { valid: true } : { valid: false, message: rule.message || defaultMessages.maxLength };
		}
		if (rule.custom && typeof rule.custom === 'function') {
			const r = rule.custom(value, context);
			const resolved = (r && typeof r.then === 'function') ? await r : r;
			if (resolved === true || (resolved && resolved.valid)) {
				return { valid: true, message: resolved && resolved.message };
			}
			return { valid: false, message: (resolved && resolved.message) || rule.message || 'Invalid' };
		}
	}
	// unknown rule object => pass
	return { valid: true };
}

/**
 * rules: object, array or schema object { field: rules }
 * options: { stopOnFirstError: boolean }
 * returns { valid: boolean, message?: string }
 */
async function validate(value, rules, context = {}, options = {}) {
	// 支援 schema 物件 (當 value 為整個 form values 時)
	if (rules && typeof rules === 'object' && !Array.isArray(rules) && context && context.isSchema) {
		// rules is { field: rules }
		for (const [field, r] of Object.entries(rules)) {
			const val = value ? FormManagerLikeGet(value, field) : undefined;
			const res = await validate(val, r, Object.assign({}, context, { field }));
			if (!res.valid) return { valid: false, message: res.message, field };
		}
		return { valid: true };
	}

	if (!rules) return { valid: true };
	const arr = Array.isArray(rules) ? rules : [rules];
	for (const r of arr) {
		const res = await runRule(value, r, context);
		if (!res || res.valid === false) {
			return { valid: false, message: res && res.message ? res.message : (r && r.message) || 'Invalid' };
		}
	}
	return { valid: true };
}

// 小 helper 用於 schema 驗證（避免循環依賴於 FormManager）
function FormManagerLikeGet(valuesObj, path) {
	if (!path) return undefined;
	const parts = String(path).replace(/\[(\w+)\]/g, '.$1').split('.').filter(Boolean);
	let cur = valuesObj;
	for (const p of parts) {
		if (cur == null) return undefined;
		cur = cur[p];
	}
	return cur;
}

module.exports = {
	validate,
	defaultMessages,
	registerRule
};
