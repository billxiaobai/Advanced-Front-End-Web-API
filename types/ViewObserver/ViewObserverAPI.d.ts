import ElementTracker = require('./ElementTracker');
import ObserverManager = require('./ObserverManager');

declare const ViewObserverAPI: {
	observe(element: Element, callback: (entry: IntersectionObserverEntry, tracker?: ElementTracker) => void, options?: IntersectionObserverInit | {}): ElementTracker | null;
	unobserve(element: Element, callback?: (entry: IntersectionObserverEntry) => void, options?: IntersectionObserverInit | {}): void;
	createManager(): ObserverManager;
	ElementTracker: typeof ElementTracker;
};
export = ViewObserverAPI;
