// 小型路徑比對器：支援 /users/:id 與 /files/* 類型
function trimSlash(s) {
	return (s || '').replace(/(^\/+|\/+$)/g, '');
}

function splitPath(s) {
	const t = trimSlash(s);
	return t === '' ? [] : t.split('/');
}

// pattern: '/users/:id'  path: '/users/123'
function match(pattern, path) {
	const pp = splitPath(pattern);
	const pa = splitPath(path);
	const params = {};
	let i = 0;
	for (; i < pp.length; i++) {
		const segP = pp[i];
		const segA = pa[i];
		if (segP === '*') {
			// wildcard: capture the rest
			params['*'] = pa.slice(i).join('/');
			return { matched: true, params };
		}
		if (segP && segP.startsWith(':')) {
			const name = segP.slice(1);
			if (typeof segA === 'undefined') return { matched: false };
			params[name] = decodeURIComponent(segA);
			continue;
		}
		// exact match
		if (segP !== segA) return { matched: false };
	}
	// if path has extra segments but pattern consumed all (no wildcard), not a match
	if (pa.length > pp.length) return { matched: false };
	return { matched: true, params };
}

module.exports = {
	match
};
