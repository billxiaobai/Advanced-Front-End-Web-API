let rafId = null;
let queue = [];

function schedule(fn) {
	queue.push(fn);
	if (rafId === null) {
		rafId = (typeof requestAnimationFrame !== 'undefined')
			? requestAnimationFrame(() => {
				const tasks = queue;
				queue = [];
				rafId = null;
				for (let t of tasks) {
					try { t(); } catch (e) { /* swallow errors per-task */ }
				}
			})
			: setTimeout(() => {
				const tasks = queue;
				queue = [];
				rafId = null;
				for (let t of tasks) {
					try { t(); } catch (e) { /* swallow errors per-task */ }
				}
			}, 16);
	}
}

module.exports = {
	schedule
};