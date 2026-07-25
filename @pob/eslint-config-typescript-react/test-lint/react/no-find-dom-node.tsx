declare function findDOMNode(node: unknown): unknown;

export function find(node: unknown): unknown {
  // eslint-disable-next-line react/no-find-dom-node
  return findDOMNode(node);
}
