import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BinaryLiftingTable } from '../src/index.js';

// A small tree used throughout:
//            0
//          / | \
//         1  2  3
//        / \    |
//       4   5   6
//          / \
//         7   8
const parents = [-1, 0, 0, 0, 1, 1, 3, 5, 5];

function tree() {
  return new BinaryLiftingTable(parents);
}

test('single node tree has root at depth 0', () => {
  const t = new BinaryLiftingTable([-1]);
  assert.equal(t.size, 1);
  assert.equal(t.root, 0);
  assert.equal(t.depth(0), 0);
  assert.equal(t.lca(0, 0), 0);
  assert.equal(t.kthAncestor(0, 0), 0);
  assert.equal(t.kthAncestor(0, 1), -1);
});

test('depth matches parent chain length', () => {
  const t = tree();
  assert.equal(t.depth(0), 0);
  assert.equal(t.depth(1), 1);
  assert.equal(t.depth(2), 1);
  assert.equal(t.depth(3), 1);
  assert.equal(t.depth(4), 2);
  assert.equal(t.depth(5), 2);
  assert.equal(t.depth(6), 2);
  assert.equal(t.depth(7), 3);
  assert.equal(t.depth(8), 3);
});

test('kthAncestor walks up by exact distance', () => {
  const t = tree();
  assert.equal(t.kthAncestor(7, 0), 7);
  assert.equal(t.kthAncestor(7, 1), 5);
  assert.equal(t.kthAncestor(7, 2), 1);
  assert.equal(t.kthAncestor(7, 3), 0);
  assert.equal(t.kthAncestor(7, 4), -1);
  assert.equal(t.kthAncestor(6, 1), 3);
  assert.equal(t.kthAncestor(6, 2), 0);
  assert.equal(t.kthAncestor(6, 3), -1);
});

test('kthAncestor handles large k without overflow', () => {
  const t = tree();
  assert.equal(t.kthAncestor(8, 1000), -1);
  assert.equal(t.kthAncestor(0, 1000), -1);
});

test('lca of a node with itself is the node', () => {
  const t = tree();
  for (let i = 0; i < parents.length; i++) {
    assert.equal(t.lca(i, i), i);
  }
});

test('lca of ancestor and descendant is the ancestor', () => {
  const t = tree();
  assert.equal(t.lca(0, 7), 0);
  assert.equal(t.lca(1, 8), 1);
  assert.equal(t.lca(5, 7), 5);
  assert.equal(t.lca(7, 5), 5);
});

test('lca of siblings is their parent', () => {
  const t = tree();
  assert.equal(t.lca(4, 5), 1);
  assert.equal(t.lca(7, 8), 5);
  assert.equal(t.lca(1, 2), 0);
});

test('lca across different subtrees', () => {
  const t = tree();
  assert.equal(t.lca(4, 6), 0);
  assert.equal(t.lca(7, 6), 0);
  assert.equal(t.lca(2, 8), 0);
  assert.equal(t.lca(4, 8), 1);
});

test('distance is symmetric and counts edges', () => {
  const t = tree();
  assert.equal(t.distance(0, 0), 0);
  assert.equal(t.distance(4, 5), 2);
  assert.equal(t.distance(5, 4), 2);
  assert.equal(t.distance(7, 8), 2);
  assert.equal(t.distance(4, 6), 4);
  assert.equal(t.distance(7, 6), 5);
});

test('isAncestor distinguishes direction', () => {
  const t = tree();
  assert.equal(t.isAncestor(0, 7), true);
  assert.equal(t.isAncestor(1, 7), true);
  assert.equal(t.isAncestor(5, 7), true);
  assert.equal(t.isAncestor(7, 7), true);
  assert.equal(t.isAncestor(7, 5), false);
  assert.equal(t.isAncestor(4, 7), false);
  assert.equal(t.isAncestor(2, 8), false);
});

test('rejects malformed parents', () => {
  assert.throws(() => new BinaryLiftingTable([]), TypeError);
  assert.throws(() => new BinaryLiftingTable([-1, 0.5]), TypeError);
  assert.throws(() => new BinaryLiftingTable([-1, 2]), RangeError);
  assert.throws(() => new BinaryLiftingTable([-1, -2]), RangeError);
  assert.throws(() => new BinaryLiftingTable([0, 0]), RangeError);
  assert.throws(() => new BinaryLiftingTable([-1, -1]), RangeError);
  assert.throws(() => new BinaryLiftingTable([1, 0]), RangeError);
});

test('rejects invalid query arguments', () => {
  const t = tree();
  assert.throws(() => t.depth(9), RangeError);
  assert.throws(() => t.depth(-1), RangeError);
  assert.throws(() => t.kthAncestor(1, -1), RangeError);
  assert.throws(() => t.kthAncestor(1, 1.5), RangeError);
  assert.throws(() => t.lca(1, 9), RangeError);
});

test('deep chain stays correct', () => {
  const n = 64;
  const chain = [-1];
  for (let i = 1; i < n; i++) chain.push(i - 1);
  const t = new BinaryLiftingTable(chain);
  assert.equal(t.depth(n - 1), n - 1);
  assert.equal(t.kthAncestor(n - 1, 63), 0);
  assert.equal(t.kthAncestor(n - 1, 64), -1);
  assert.equal(t.lca(n - 1, 0), 0);
  assert.equal(t.lca(n - 1, n - 2), n - 2);
  assert.equal(t.distance(0, n - 1), n - 1);
});
