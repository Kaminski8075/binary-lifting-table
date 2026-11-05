# binary-lifting-table

Precomputes ancestor lookups at power-of-two distances on a rooted tree, giving
O(log n) kth-ancestor and lowest-common-ancestor queries after O(n log n)
construction.

```js
import { BinaryLiftingTable } from 'binary-lifting-table';

// 0 is the root; parents[i] is the parent of i, or -1 for the root.
const table = new BinaryLiftingTable([-1, 0, 0, 1, 1, 2]);

table.depth(5);            // 2
table.kthAncestor(5, 1);   // 2
table.kthAncestor(5, 2);   // 0
table.kthAncestor(5, 3);   // -1  (above the root)
table.lca(4, 5);           // 0
table.distance(4, 5);      // 4
table.isAncestor(0, 5);    // true
table.isAncestor(5, 0);    // false
```

## Why this exists

Answering "who is the ancestor of this node k steps up?" by walking the parent
chain one edge at a time is O(k), which is fine for shallow trees and painful
for the long chains that show up in link-cut trees, suffix automata, and
genealogical data. The binary lifting table pays O(n log n) memory once and then
answers each kth-ancestor or LCA query in O(log n) by decomposing the distance
into powers of two. The trade-off is memory: the table stores log2(n) ancestors
per node, so it is roughly n log n integers. For small trees a plain parent
array and a loop are cheaper; for repeated queries on a large tree the table
wins.

## API

`new BinaryLiftingTable(parents)` builds the table. `parents` is an array of
length n; `parents[i]` is the integer id of node i's parent, or `-1` if i is the
root. Exactly one node must have `-1` as its parent, and the parent relation
must form a tree (no cycles, no self-parents, no out-of-range ids). Any
violation throws `TypeError` or `RangeError` at construction time.

- `table.size` — number of nodes.
- `table.root` — id of the root node.
- `table.depth(node)` — number of edges from the root, root at depth 0.
- `table.kthAncestor(node, k)` — ancestor k edges up, or `-1` if that would go
  above the root. `k` must be a non-negative integer.
- `table.lca(a, b)` — lowest common ancestor.
- `table.distance(a, b)` — number of edges on the path between a and b.
- `table.isAncestor(a, b)` — true when a is on the path from b up to the root.

## The awkward edge

There is no sentinel node above the root, so `kthAncestor` returns `-1` when the
requested ancestor would be above the root. Callers that want a different
sentinel (or an exception) should check `depth(node) < k` first. The library
chooses `-1` because it is the same value the constructor uses for "no parent",
so a tree can be round-tripped through the table without a second convention.
