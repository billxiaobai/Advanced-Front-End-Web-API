const Dom = require('./DomManipulator');

// render a vnode from scratch
function render(vnode) {
	return Dom.createElement(vnode);
}

// reconcile: oldVnode may be null; dom is current DOM node corresponding to oldVnode (may be null)
function reconcile(dom, oldVnode, newVnode) {
	// 如果沒有舊 vnode，建立並回傳新的 DOM
	if (!oldVnode) {
		const nd = render(newVnode);
		return nd;
	}
	// 若沒有現有 DOM 但有舊 vnode，建立新的並回傳
	if (!dom) {
		const nd = render(newVnode);
		return nd;
	}
	// 使用 DomManipulator 更新現有 DOM
	return Dom.updateElement(dom, oldVnode, newVnode);
}

module.exports = {
	render,
	reconcile
};
