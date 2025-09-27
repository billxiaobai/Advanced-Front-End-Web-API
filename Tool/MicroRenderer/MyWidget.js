const Component = require('../MicroRenderer/Component');

class MyWidget extends Component {
	constructor(props) {
		super(props);
		this.state = this.state || {};
	}
	render() {
		return {
			tag: 'div',
			props: {},
			children: [
				{ type: 'text', text: 'MyWidget component' }
			]
		};
	}
}

module.exports = MyWidget;
