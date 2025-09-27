const { match } = require('../../Tool/SimpleRouter/RouteMatcher');

describe('RouteMatcher', () => {
	test('matches dynamic param :id', () => {
		const res = match('/users/:id', '/users/123');
		expect(res.matched).toBe(true);
		expect(res.params.id).toBe('123');
	});

	test('matches wildcard * capturing rest', () => {
		const res = match('/files/*', '/files/a/b/c.txt');
		expect(res.matched).toBe(true);
		expect(res.params['*']).toBe('a/b/c.txt');
	});

	test('does not match when extra segments exist', () => {
		const res = match('/a', '/a/b');
		expect(res.matched).toBe(false);
	});

	test('root "/" matches "/"', () => {
		const res = match('/', '/');
		expect(res.matched).toBe(true);
	});
});
