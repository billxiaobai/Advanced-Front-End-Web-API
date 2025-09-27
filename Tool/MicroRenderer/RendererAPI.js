const Diff = require('./DiffEngine');

function create(componentClass, props) {
	return new componentClass(props);
}

function createRenderer() {
	const mounted = new Set();

	function mount(component, container) {
		if (!component || !container) return;
		// 若傳入的是 component class (constructor) 則自動建立實例
		if (typeof component === 'function') {
			try { component = new component(); } catch (e) { /* ignore */ }
		}
		// 如果已經 mount 在同一 container，直接回傳 DOM
		if (component.__internal && component.__internal.container === container && component.__internal.dom) {
			return component.__internal.dom;
		}
		// 若已經 mount 在其他 container ，先移除舊的
		if (component.__internal && component.__internal.container && component.__internal.dom) {
			try { component.__internal.container.removeChild(component.__internal.dom); } catch (e) {}
		}
		// 註冊 renderer 回呼到 component
		component.__internal = component.__internal || {};
		component.__internal.renderer = {
			updateComponent,
			unmountComponent
		};
		component.__internal.container = container;
		// 初次 render
		const vnode = component.render();
		const dom = Diff.render(vnode);
		component.__internal.vdom = vnode;
		component.__internal.dom = dom;
		try { container.appendChild(dom); } catch (e) { /* ignore */ }
		mounted.add(component);
		return dom;
	}

	function updateComponent(component) {
		if (!component || !mounted.has(component)) return;
		const oldVdom = component.__internal.vdom;
		const oldDom = component.__internal.dom;
		const newVdom = component.render();
		const newDom = Diff.reconcile(oldDom, oldVdom, newVdom);
		// 如果 reconcile 回傳了不同的節點（例如被替換），更新 parent reference
		if (newDom !== oldDom && component.__internal.container) {
			try {
				component.__internal.container.replaceChild(newDom, oldDom);
			} catch (e) { /* ignore if already handled */ }
		}
		component.__internal.vdom = newVdom;
		component.__internal.dom = newDom;
		return newDom;
	}

	function unmountComponent(component) {
		if (!component || !mounted.has(component)) return;
		// 若使用者定義 componentWillUnmount，先呼叫它
		if (typeof component.componentWillUnmount === 'function') {
			try { component.componentWillUnmount(); } catch (e) {}
		}
		const dom = component.__internal.dom;
		const container = component.__internal.container;
		if (dom && container) {
			try { container.removeChild(dom); } catch (e) {}
		}
		component.__internal = {};
		mounted.delete(component);
	}

	return {
		mount,
		updateComponent,
		unmountComponent
	};
}

// 新增：建立一個預設 renderer 實例以利整個應用共用
const defaultRenderer = createRenderer();

// 對外提供便利包裝：create, createRenderer, defaultRenderer 以及直接 mount/unmount using defaultRenderer
module.exports = {
	create,
	createRenderer,
	defaultRenderer,
	// 簡單 wrapper，方便直接使用
	mount(component, container) { return defaultRenderer.mount(component, container); },
	update(component) { return defaultRenderer.updateComponent(component); },
	unmount(component) { return defaultRenderer.unmountComponent(component); }
};
