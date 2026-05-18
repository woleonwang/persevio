import type { TreeDataNode } from "antd";

export const DEFAULT_ORG_TREE_VISIBLE_LEVELS = 3;

export type OrgNodeTreeData = TreeDataNode & {
  value: number;
};

/** 收集需展开的节点 key，使树默认可见 maxVisibleLevels 层（根为第 1 层） */
export function collectTreeExpandKeysForVisibleLevels(
  treeData: OrgNodeTreeData[],
  maxVisibleLevels = DEFAULT_ORG_TREE_VISIBLE_LEVELS,
): number[] {
  if (maxVisibleLevels <= 1) return [];

  const keys: number[] = [];
  const walk = (nodes: TreeDataNode[], depth: number) => {
    for (const node of nodes) {
      const children = node.children as TreeDataNode[] | undefined;
      if (!children?.length) continue;
      if (depth < maxVisibleLevels - 1) {
        keys.push(node.key as number);
        walk(children, depth + 1);
      }
    }
  };
  walk(treeData, 0);
  return keys;
}

/** 将扁平 org_nodes 转为 antd Tree / TreeSelect 用的树；根节点 parent_id 为 null */
export function buildOrgNodesTreeData(
  nodes: IOrgNode[],
  visibleOrgNodeIds?: number[],
): {
  root: IOrgNode | undefined;
  treeData: OrgNodeTreeData[];
} {
  const root = nodes.find((n) => !n.parent_id);
  if (!root) {
    return { root: undefined, treeData: [] };
  }

  const { displayIds, selectableIds } = buildRecruiterOrgNodeScope(
    nodes,
    visibleOrgNodeIds,
  );

  const byParent = new Map<number | null, IOrgNode[]>();
  for (const n of nodes) {
    const p = n.parent_id;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(n);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.sort_order - b.sort_order);
  }

  const build = (parentId: number): OrgNodeTreeData[] => {
    const list = byParent.get(parentId) ?? [];
    return list
      .map((n) => ({
        title: n.name,
        key: n.id,
        value: n.id,
        children: build(n.id),
        disabled: visibleOrgNodeIds && !selectableIds.has(n.id),
      }))
      .filter((n) => !visibleOrgNodeIds || displayIds.has(n.key));
  };

  const treeData: OrgNodeTreeData[] = [
    {
      title: root.name,
      key: root.id,
      value: root.id,
      children: build(root.id),
      disabled: visibleOrgNodeIds && !selectableIds.has(root.id),
    },
  ];

  return { root, treeData };
}

export function orgNodesToIdTitleMap(nodes: IOrgNode[]): Map<number, string> {
  return new Map(nodes.map((n) => [n.id, n.name]));
}

/** 选中节点及其所有后代节点 id（含自身） */
export function collectDescendantOrgNodeIds(
  nodeId: number,
  treeData: TreeDataNode[],
): Set<number> {
  const targetKey = nodeId;

  const findSubtree = (nodes: TreeDataNode[]): Set<number> | null => {
    for (const node of nodes) {
      if (node.key === targetKey) {
        return collectSubtreeIds(node);
      }
      const children = node.children as TreeDataNode[] | undefined;
      if (children?.length) {
        const found = findSubtree(children);
        if (found) return found;
      }
    }
    return null;
  };

  return findSubtree(treeData) ?? new Set([nodeId]);
}

/** 查找节点父级 key；根节点返回 null */
export function findParentKey(
  tree: TreeDataNode[],
  targetKey: number,
): number | null {
  for (const node of tree) {
    const children = node.children as TreeDataNode[] | undefined;
    if (children?.some((c) => c.key === targetKey)) {
      return node.key as number;
    }
    if (children?.length) {
      const r = findParentKey(children, targetKey);
      if (r !== null) return r;
    }
  }
  return null;
}

/** 收集某节点的所有祖先 id（不含自身） */
function collectAncestorOrgNodeIds(
  nodeId: number,
  nodes: IOrgNode[],
): number[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const ancestorIds: number[] = [];
  let current = byId.get(nodeId);
  while (current?.parent_id != null) {
    ancestorIds.push(current.parent_id);
    current = byId.get(current.parent_id);
  }
  return ancestorIds;
}

/** 收集某节点的所有后代 id（不含自身） */
function collectDescendantOrgNodeIdsFromFlat(
  nodeId: number,
  nodes: IOrgNode[],
): number[] {
  const childrenByParent = new Map<number, IOrgNode[]>();
  for (const n of nodes) {
    if (n.parent_id == null) continue;
    if (!childrenByParent.has(n.parent_id)) {
      childrenByParent.set(n.parent_id, []);
    }
    childrenByParent.get(n.parent_id)!.push(n);
  }

  const descendantIds: number[] = [];
  const stack = [nodeId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const child of childrenByParent.get(id) ?? []) {
      descendantIds.push(child.id);
      stack.push(child.id);
    }
  }
  return descendantIds;
}

/** 从子树收集节点 id（含根） */
function collectSubtreeIds(node: TreeDataNode): Set<number> {
  const ids = new Set<number>();
  const id = Number(node.key);
  if (!Number.isNaN(id)) ids.add(id);
  for (const child of (node.children as TreeDataNode[] | undefined) ?? []) {
    for (const childId of collectSubtreeIds(child)) {
      ids.add(childId);
    }
  }
  return ids;
}

/**
 * recruiter 范围：
 * - 展示：所在部门 + 可见部门 + 各自全部子部门 + 各自全部祖先
 * - 可选：所在部门 + 可见部门 + 各自全部子部门（祖先仅作路径展示则禁用）
 */
function buildRecruiterOrgNodeScope(
  nodes: IOrgNode[],
  visibleOrgNodeIds?: number[],
): { displayIds: Set<number>; selectableIds: Set<number> } {
  const displayIds = new Set<number>();
  const selectableIds = new Set<number>();
  const seeds = Array.from(new Set(visibleOrgNodeIds));

  for (const seedId of seeds) {
    selectableIds.add(seedId);
    displayIds.add(seedId);
    for (const descendantId of collectDescendantOrgNodeIdsFromFlat(
      seedId,
      nodes,
    )) {
      selectableIds.add(descendantId);
      displayIds.add(descendantId);
    }

    for (const ancestorId of collectAncestorOrgNodeIds(seedId, nodes)) {
      displayIds.add(ancestorId);
    }
  }

  return { displayIds, selectableIds };
}
