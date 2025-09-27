type VNode = any;

export function render(vnode: VNode): Node;
export function reconcile(dom: Node | null, oldVnode: VNode | null, newVnode: VNode | null): Node | null;
