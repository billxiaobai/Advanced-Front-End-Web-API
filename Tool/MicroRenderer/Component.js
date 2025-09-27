class Component {
	constructor(props) {
		this.props = props || {};
		this.state = {};
		// internal: renderer, vdom, dom, container
		this.__internal = {
			renderer: null,
			vdom: null,
			dom: null,
			container: null
		};
	}
	// 使用部分 state update（合併）
	setState(partial) {
		if (!partial || typeof partial !== 'object') return;
		this.state = Object.assign({}, this.state, partial);
		// 若已綁定 renderer，則要求更新
		const r = this.__internal && this.__internal.renderer;
		if (r && typeof r.updateComponent === 'function') {
			r.updateComponent(this);
		}
	}
	// 被使用者覆寫以回傳 vnode
	render() {
		return null;
	}
	// 便利取目前 DOM 節點
	getDom() {
		return this.__internal.dom;
	}
}

module.exports = Component;
