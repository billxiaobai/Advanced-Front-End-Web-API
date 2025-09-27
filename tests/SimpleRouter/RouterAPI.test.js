const { createRouter } = require('../../Tool/SimpleRouter/RouterAPI');

describe('RouterAPI integration', () => {
	test('createRouter mounts function component to provided root with params', async () => {
		const root = document.createElement('div');
		document.body.appendChild(root);

		const routes = [
			{
				path: '/home/:id',
				name: 'home',
				component: (props) => {
					const id = props && props.params ? props.params.id : '';
					return `<div class="home">home-${id}</div>`;
				}
			}
		];

		const router = createRouter(routes, { root });
		router.start();
		await router.push('/home/42');

		expect(root.querySelector('.home')).not.toBeNull();
		expect(root.textContent).toContain('home-42');

		// cleanup
		router.stop();
		document.body.removeChild(root);
	});

	test('navigateByName builds path and navigates', async () => {
		const root = document.createElement('div');
		document.body.appendChild(root);

		const routes = [
			{
				path: '/item/:id',
				name: 'item',
				component: (props) => `<span>item-${props.params.id}</span>`
			}
		];

		const router = createRouter(routes, { root });
		router.start();
		await router.navigateByName('item', { id: '99' });

		expect(root.textContent).toContain('item-99');

		router.stop();
		document.body.removeChild(root);
	});
});
