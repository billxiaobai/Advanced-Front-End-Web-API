// 提供簡單的 RAF polyfill 與其他測試環境 helper
if (typeof global.requestAnimationFrame !== 'function') {
	global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
	global.cancelAnimationFrame = (id) => clearTimeout(id);
}
