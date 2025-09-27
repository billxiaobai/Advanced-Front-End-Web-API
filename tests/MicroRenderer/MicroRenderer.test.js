const MicroRenderer = require('../../Tool/MicroRenderer/RendererAPI');
const Component = require('../../Tool/MicroRenderer/Component');

describe('MicroRenderer basic behavior', () => {
	test('mount renders initial vnode and setState updates DOM', () => {
		class Counter extends Component {
			constructor(props) {
				super(props);
				this.state = { count: props.initial || 0 };
			}
			render() {
				return {
					// element vnode
					tag: 'div',
					props: {},
					children: [{ type: 'text', text: String(this.state.count) }]
				};
			}
		}

		const comp = MicroRenderer.create(Counter, { initial: 1 });
		const container = document.createElement('div');
		document.body.appendChild(container);

		MicroRenderer.mount(comp, container);
		expect(container.textContent).toBe('1');

		comp.setState({ count: 2 });
		expect(container.textContent).toBe('2');

		// cleanup
		MicroRenderer.unmount(comp);
		document.body.removeChild(container);
	});

	test('unmount calls componentWillUnmount and removes DOM', () => {
		const willUnmount = jest.fn();
		class TestComp extends Component {
			render() {
				return { tag: 'div', props: {}, children: [{ type: 'text', text: 'x' }] };
			}
			componentWillUnmount() {
				willUnmount();
			}
		}

		const comp = MicroRenderer.create(TestComp);
		const container = document.createElement('div');
		document.body.appendChild(container);

		MicroRenderer.mount(comp, container);
		expect(container.textContent).toBe('x');

		MicroRenderer.unmount(comp);
		expect(willUnmount).toHaveBeenCalled();
		expect(container.childNodes.length).toBe(0);

		document.body.removeChild(container);
	});

	test('props event handlers are bound and triggered', () => {
		const handler = jest.fn();
		class Btn extends Component {
			render() {
				return {
					tag: 'button',
					props: { onClick: this.props.onClick },
					children: [{ type: 'text', text: 'ok' }]
				};
			}
		}

		const comp = MicroRenderer.create(Btn, { onClick: handler });
		const container = document.createElement('div');
		document.body.appendChild(container);

		MicroRenderer.mount(comp, container);
		const btn = container.querySelector('button');
		expect(btn).not.toBeNull();

		btn.click();
		expect(handler).toHaveBeenCalled();

		MicroRenderer.unmount(comp);
		document.body.removeChild(container);
	});
});
