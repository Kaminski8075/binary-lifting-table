/**
 * Binary lifting table for rooted trees.
 *
 * The table stores, for every node and every power of two j, the ancestor of
 * that node at distance 2^j. This lets us answer kth-ancestor queries in
 * O(log k) by decomposing k into powers of two, and lowest-common-ancestor
 * queries in O(log n) by first equalising depths and then climbing both
 * nodes together.
 *
 * The constructor takes the parent of each node. The root is a node whose
 * parent is -1. Node ids must be integers in [0, n). The input is validated
 * so that a malformed tree fails loudly at construction time rather than
 * producing silent nonsense later.
 */
export class BinaryLiftingTable {
  /**
   * @param {number[]} parents parent[i] is the parent of node i, or -1 for the root.
   */
  constructor(parents) {
    if (!Array.isArray(parents) || parents.length === 0) {
      throw new TypeError('parents must be a non-empty array');
    }
    const n = parents.length;
    for (let i = 0; i < n; i++) {
      const p = parents[i];
      if (!Number.isInteger(p)) {
        throw new TypeError(`parent of node ${i} must be an integer`);
      }
      if (p < -1 || p >= n) {
        throw new RangeError(`parent of node ${i} is out of range: ${p}`);
      }
      if (p === i) {
        throw new RangeError(`node ${i} cannot be its own parent`);
      }
    }

    // Exactly one root: a tree with two roots is a forest, and kth-ancestor
    // queries would have no defined answer for nodes in disconnected pieces.
    let root = -1;
    for (let i = 0; i < n; i++) {
      if (parents[i] === -1) {
        if (root !== -1) {
          throw new RangeError('parents describe a forest, not a tree: multiple roots');
        }
        root = i;
      }
    }
    if (root === -1) {
      throw new RangeError('parents describe a forest, not a tree: no root');
    }

    // Depth via memoised climb. The parent chain is finite because every
    // non-root node has a parent and the root terminates it; a cycle would
    // make this loop forever, so detect it by capping the climb at n steps.
    const depth = new Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
      if (depth[i] !== -1) continue;
      const path = [];
      let cur = i;
      while (cur !== -1 && depth[cur] === -1) {
        path.push(cur);
        cur = parents[cur];
        if (path.length > n) {
          throw new RangeError('parents contain a cycle');
        }
      }
      let d = cur === -1 ? 0 : depth[cur] + 1;
      for (let k = path.length - 1; k >= 0; k--) {
        depth[path[k]] = d;
        d += 1;
      }
    }

    const levels = Math.max(1, Math.ceil(Math.log2(n)) + 1);
    const up = new Array(levels);
    up[0] = parents.slice();
    for (let j = 1; j < levels; j++) {
      const prev = up[j - 1];
      const cur = new Array(n);
      for (let i = 0; i < n; i++) {
        const mid = prev[i];
        cur[i] = mid === -1 ? -1 : prev[mid];
      }
      up[j] = cur;
    }

    this._n = n;
    this._root = root;
    this._depth = depth;
    this._up = up;
    this._levels = levels;
  }

  /** Number of nodes in the tree. */
  get size() {
    return this._n;
  }

  /** Id of the root node. */
  get root() {
    return this._root;
  }

  /**
   * Depth of a node, with the root at depth 0.
   * @param {number} node
   * @returns {number}
   */
  depth(node) {
    this._checkNode(node);
    return this._depth[node];
  }

  /**
   * Ancestor of `node` at distance `k`. Returns -1 when the ancestor would be
   * above the root, which is the only sensible answer for a tree with no
   * sentinel node.
   * @param {number} node
   * @param {number} k
   * @returns {number}
   */
  kthAncestor(node, k) {
    this._checkNode(node);
    if (!Number.isInteger(k) || k < 0) {
      throw new RangeError(`k must be a non-negative integer, got ${k}`);
    }
    let cur = node;
    let bit = 0;
    while (k > 0) {
      if (bit >= this._levels) break;
      if (k & 1) {
        cur = this._up[bit][cur];
        if (cur === -1) return -1;
      }
      k >>>= 1;
      bit += 1;
    }
    return cur;
  }

  /**
   * Lowest common ancestor of two nodes.
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  lca(a, b) {
    this._checkNode(a);
    this._checkNode(b);
    if (this._depth[a] < this._depth[b]) {
      const t = a; a = b; b = t;
    }
    a = this._climb(a, this._depth[a] - this._depth[b]);
    if (a === b) return a;
    for (let j = this._levels - 1; j >= 0; j--) {
      const ua = this._up[j][a];
      const ub = this._up[j][b];
      if (ua !== ub) {
        a = ua;
        b = ub;
      }
    }
    return this._up[0][a];
  }

  /**
   * Distance in edges between two nodes.
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  distance(a, b) {
    const l = this.lca(a, b);
    return this._depth[a] + this._depth[b] - 2 * this._depth[l];
  }

  /**
   * True when `ancestor` lies on the path from `node` up to the root.
   * @param {number} ancestor
   * @param {number} node
   * @returns {boolean}
   */
  isAncestor(ancestor, node) {
    this._checkNode(ancestor);
    this._checkNode(node);
    return this._depth[ancestor] <= this._depth[node] &&
      this._climb(node, this._depth[node] - this._depth[ancestor]) === ancestor;
  }

  _climb(node, k) {
    let cur = node;
    let bit = 0;
    while (k > 0) {
      if (bit >= this._levels) return -1;
      if (k & 1) {
        cur = this._up[bit][cur];
        if (cur === -1) return -1;
      }
      k >>>= 1;
      bit += 1;
    }
    return cur;
  }

  _checkNode(node) {
    if (!Number.isInteger(node) || node < 0 || node >= this._n) {
      throw new RangeError(`node out of range: ${node}`);
    }
  }
}
