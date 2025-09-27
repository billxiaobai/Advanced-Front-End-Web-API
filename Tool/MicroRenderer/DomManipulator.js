function isEventProp(name) {
	return /^on[A-Z]/.test(name);
}
function setProp(dom, name, value) {
	if (name === 'style' && value && typeof value === 'object') {
		for (const k in value) {
			dom.style[k] = value[k];
		}
		return;
	}
	if (isEventProp(name)) {
		const eventName = name.slice(2).toLowerCase();
		dom.__handlers = dom.__handlers || {};
		if (dom.__handlers[eventName]) dom.removeEventListener(eventName, dom.__handlers[eventName]);
		dom.__handlers[eventName] = value;
		if (typeof value === 'function') dom.addEventListener(eventName, value);
		return;
	}
	if (value === false || value == null) {
		dom.removeAttribute(name);
	} else {
		dom.setAttribute(name, value === true ? '' : String(value));
	}
}
function removeProp(dom, name) {
	if (name === 'style') {
		dom.removeAttribute('style');
		return;
	}
	if (isEventProp(name)) {
		const eventName = name.slice(2).toLowerCase();
		if (dom.__handlers && dom.__handlers[eventName]) {
			dom.removeEventListener(eventName, dom.__handlers[eventName]);
			delete dom.__handlers[eventName];
		}
		return;
	}
	dom.removeAttribute(name);
}

function createElement(vnode) {
	if (vnode == null) return document.createTextNode('');
	if (vnode.type === 'text') {
		return document.createTextNode(String(vnode.text || ''));
	}
	const el = document.createElement(vnode.tag || 'div');
	const props = vnode.props || {};
	for (const k in props) {
		setProp(el, k, props[k]);
	}
	const children = vnode.children || [];
	for (const c of children) {
		el.appendChild(createElement(c));
	}
	return el;
}

function updateElement(dom, oldVnode, newVnode) {
	// 若舊 vnode 不存在，建立新的
	if (!oldVnode) {
		const newDom = createElement(newVnode);
		if (dom && dom.parentNode) dom.parentNode.replaceChild(newDom, dom);
		return newDom;
	}
	// 若新不存在，移除舊 DOM
	if (!newVnode) {
		if (dom && dom.parentNode) dom.parentNode.removeChild(dom);
		return null;
	}
	// text 節點處理
	if (oldVnode.type === 'text' || newVnode.type === 'text') {
		if (oldVnode.type === 'text' && newVnode.type === 'text') {
			if (oldVnode.text !== newVnode.text) dom.textContent = newVnode.text;
			return dom;
		}
		// type 改變 -> 替換
		const nd = createElement(newVnode);
		dom.parentNode.replaceChild(nd, dom);
		return nd;
	}
	// tag 不同 -> 替換整個節點
	if (oldVnode.tag !== newVnode.tag) {
		const nd = createElement(newVnode);
		if (dom && dom.parentNode) dom.parentNode.replaceChild(nd, dom);
		return nd;
	}
	// 更新屬性
	const oldProps = oldVnode.props || {};
	const newProps = newVnode.props || {};
	// 移除舊屬性
	for (const k in oldProps) {
		if (!(k in newProps)) removeProp(dom, k);
	}
	// 設定新屬性
	for (const k in newProps) {
		if (oldProps[k] !== newProps[k]) setProp(dom, k, newProps[k]);
	}
	// 比對 children（以 index 對齊）
	const oldChildren = oldVnode.children || [];
	const newChildren = newVnode.children || [];
	const max = Math.max(oldChildren.length, newChildren.length);
	for (let i = 0; i < max; i++) {
		const oldC = oldChildren[i];
		const newC = newChildren[i];
		const childDom = dom.childNodes[i];
		if (!oldC && newC) {
			dom.appendChild(createElement(newC));
		} else if (oldC && !newC) {
			if (childDom) dom.removeChild(childDom);
		} else {
			updateElement(childDom, oldC, newC);
		}
	}
	return dom;
}

module.exports = {
	createElement,
	updateElement,
	removeProp,
	setProp
};
