module.exports = {
	path: '/about',
	name: 'About',
	component: (props) => {
		const id = props && props.params ? props.params.id : '';
		return `<div class="about">Route About ${id}</div>`;
	}
};
