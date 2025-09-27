const FormManager = require('./FormManager');
const Binder = require('./Binder');
const Validator = require('./Validator');

module.exports = {
	createForm: (id, initialValues = {}, options = {}) => FormManager.createForm(id, initialValues, options),
	getForm: (id) => FormManager.getForm(id),
	destroyForm: (id) => FormManager.destroyForm(id),
	resetForm: (id, values = {}) => FormManager.resetForm(id, values),
	resetToInitial: (id) => FormManager.resetToInitial(id),
	setValidators: (id, validators) => FormManager.setValidators(id, validators),
	updateField: (id, field, value, opts) => FormManager.setFieldValue(id, field, value, opts),
	setFieldValue: (id, field, value, opts) => FormManager.setFieldValue(id, field, value, opts),
	setFieldError: (id, field, msg) => FormManager.setFieldError(id, field, msg),
	setFieldTouched: (id, field, touched) => FormManager.setFieldTouched(id, field, touched),
	setFormError: (id, msg) => FormManager.setFormError(id, msg),
	validateField: (id, field) => FormManager.validateField(id, field),
	validateAll: (id) => FormManager.validateAll(id),
	submit: (id, submitHandler) => FormManager.submit(id, submitHandler),
	bind: (formId, elOrSelector, field) => Binder.bind(formId, elOrSelector, field),
	unbind: (formId, elOrSelector, field) => Binder.unbind(formId, elOrSelector, field),
	subscribe: (id, cb) => FormManager.subscribe(id, cb),
	isDirty: (id) => FormManager.isDirty(id),
	isValid: (id) => FormManager.isValid(id),
	getValues: (id) => FormManager.getValues(id),
	getErrors: (id) => FormManager.getErrors(id),
	getMeta: (id) => FormManager.getMeta(id),
	// validator utilities
	validateValue: (value, rules, ctx) => Validator.validate(value, rules, ctx),
	registerValidator: (name, fnOrRule) => Validator.registerRule(name, fnOrRule)
};
