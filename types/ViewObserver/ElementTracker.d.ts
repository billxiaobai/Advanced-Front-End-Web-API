declare class ElementTracker {
	constructor(element: Element);
	element: Element;
	isIntersecting: boolean;
	lastEntry: IntersectionObserverEntry | null;
	updateFromEntry(entry: IntersectionObserverEntry): boolean;
	getState(): { isIntersecting: boolean; lastEntry: IntersectionObserverEntry | null };
}
export = ElementTracker;
