/**
 * Browser translation (Chrome/Edge/Google app) and some extensions replace or
 * wrap text nodes behind React's back. React then calls removeChild or
 * insertBefore on a node that is no longer where it expects, the DOM throws
 * NotFoundError, and the route falls into the error boundary.
 *
 * Make those two calls tolerate a stale parent instead of throwing. Calls on
 * nodes that really are children behave exactly as before.
 * https://github.com/facebook/react/issues/11538
 */
export function installDomMutationGuard() {
  if (typeof Node !== 'function' || !Node.prototype) return;
  const proto = Node.prototype as Node & { __ieltsDomGuard__?: boolean };
  if (proto.__ieltsDomGuard__) return;
  proto.__ieltsDomGuard__ = true;

  const nativeRemoveChild = proto.removeChild;
  proto.removeChild = function removeChild<T extends Node>(this: Node, child: T): T {
    if (child && child.parentNode !== this) return child;
    return nativeRemoveChild.call(this, child) as T;
  };

  const nativeInsertBefore = proto.insertBefore;
  proto.insertBefore = function insertBefore<T extends Node>(
    this: Node,
    node: T,
    reference: Node | null
  ): T {
    if (reference && reference.parentNode !== this) {
      // The anchor was moved by the translator; appending keeps the content on screen.
      return nativeInsertBefore.call(this, node, null) as T;
    }
    return nativeInsertBefore.call(this, node, reference) as T;
  };
}
