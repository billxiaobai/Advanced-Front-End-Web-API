module.exports = {
	path: '/{{lowerName}}',
	name: '{{name}}',
	component: (props) => {
		const id = props && props.params ? props.params.id : '';
		return `<div class="{{lowerName}}">Route {{name}} ${id}</div>`;
	}
};
