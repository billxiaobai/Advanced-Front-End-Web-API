const Component = require('../MicroRenderer/Component');

class {{name}} extends Component {
	constructor(props) {
		super(props);
		this.state = this.state || {};
	}
	render() {
		return {
			tag: 'div',
			props: {},
			children: [
				{ type: 'text', text: '{{name}} component' }
			]
		};
	}
}

module.exports = {{name}};
