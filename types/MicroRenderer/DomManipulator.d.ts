type VNode = any;

export function createElement(vnode: VNode): Node;
export function updateElement(dom: Node | null, oldVnode: VNode | null, newVnode: VNode | null): Node | null;
export function setProp(dom: HTMLElement, name: string, value: any): void;
export function removeProp(dom: HTMLElement, name: string): void;
