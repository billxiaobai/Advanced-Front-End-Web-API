class ElementTracker {
	constructor(element) {
		this.element = element;
		this.isIntersecting = false;
		this.lastEntry = null;
	}
	// 更新狀態，回傳是否有變更
	updateFromEntry(entry) {
		const prev = this.isIntersecting;
		this.lastEntry = entry;
		this.isIntersecting = !!entry.isIntersecting;
		return prev !== this.isIntersecting;
	}
	getState() {
		return {
			isIntersecting: this.isIntersecting,
			lastEntry: this.lastEntry
		};
	}
}

module.exports = ElementTracker;
