let MicroRenderer = null;
try { MicroRenderer = require('../MicroRenderer/RendererAPI'); } catch (e) { MicroRenderer = null; }

// component can be:
// - a class (extends some Component) -> instantiate and mount via MicroRenderer if available
// - a function that returns an HTML string -> use innerHTML
// - an object with render() that returns vnode -> try MicroRenderer
function mount(componentDef, container, props = {}) {
	if (!container) return null;
	// class constructor
	if (typeof componentDef === 'function' && componentDef.prototype && componentDef.prototype.render) {
		const instance = new componentDef(props);
		if (MicroRenderer && typeof MicroRenderer.mount === 'function') {
			MicroRenderer.mount(instance, container);
		} else if (typeof instance.render === 'function') {
			// fallback: try to render to HTML string if render returns simple vnode/text
			const vnode = instance.render();
			if (vnode && vnode.type === 'text') {
				container.textContent = vnode.text || '';
			} else if (vnode && vnode.tag) {
				// crude fallback: render tag with text children if possible
				let text = '';
				if (Array.isArray(vnode.children)) {
					for (const c of vnode.children) if (c && c.type === 'text') text += c.text;
				}
				const el = document.createElement(vnode.tag);
				el.textContent = text;
				container.appendChild(el);
				instance.__internal = instance.__internal || {};
				instance.__internal.dom = el;
				instance.__internal.container = container;
			}
		}
		return instance;
	}
	// function returning HTML
	if (typeof componentDef === 'function') {
		const out = componentDef(props);
		if (typeof out === 'string') {
			container.innerHTML = out;
		}
		return { __simple: true };
	}
	// object with render()
	if (componentDef && typeof componentDef.render === 'function') {
		if (MicroRenderer && typeof MicroRenderer.mount === 'function') {
			MicroRenderer.mount(componentDef, container);
			return componentDef;
		}
		// attempt simple render
		const vnode = componentDef.render();
		if (vnode && vnode.type === 'text') container.textContent = vnode.text || '';
		return componentDef;
	}
	return null;
}

function unmount(instanceOrDef) {
	if (!instanceOrDef) return;
	if (MicroRenderer && typeof MicroRenderer.unmount === 'function') {
		try { MicroRenderer.unmount(instanceOrDef); return; } catch (e) {}
	}
	// fallback: if instance has internal.dom and container, remove it
	if (instanceOrDef.__internal && instanceOrDef.__internal.dom && instanceOrDef.__internal.container) {
		try { instanceOrDef.__internal.container.removeChild(instanceOrDef.__internal.dom); } catch (e) {}
		instanceOrDef.__internal = {};
	}
}

module.exports = {
	mount,
	unmount
};
