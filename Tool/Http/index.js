const HttpUtils = require('./HttpUtils');
let HttpConfig = null;
try { HttpConfig = require('./HttpConfig'); } catch (e) { HttpConfig = null; }

module.exports = {
	HttpUtils,
	HttpConfig
};
