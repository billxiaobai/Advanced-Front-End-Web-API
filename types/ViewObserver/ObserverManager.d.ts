import ElementTracker = require('./ElementTracker');

declare class ObserverManager {
	constructor();
	observe(element: Element, options: IntersectionObserverInit | {}, callback: (entry: IntersectionObserverEntry, tracker?: ElementTracker) => void): ElementTracker | null;
	unobserve(element: Element, options?: IntersectionObserverInit | {}, callback?: ((entry: IntersectionObserverEntry) => void) | undefined): void;
	disconnectAll(): void;
}
export = ObserverManager;
