import type { TreeDataNode } from "antd";

export const DEFAULT_ORG_TREE_VISIBLE_LEVELS = 3;

/** 收集需展开的节点 key，使树默认可见 maxVisibleLevels 层（根为第 1 层） */
export function collectTreeExpandKeysForVisibleLevels(
  treeData: TreeDataNode[],
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
export function buildOrgNodesTreeData(nodes: IOrgNode[]): {
  root: IOrgNode | undefined;
  treeData: TreeDataNode[];
} {
  const root = nodes.find((n) => !n.parent_id);
  if (!root) {
    return { root: undefined, treeData: [] };
  }

  const byParent = new Map<number | null, IOrgNode[]>();
  for (const n of nodes) {
    const p = n.parent_id;
    if (!byParent.has(p)) byParent.set(p, []);
    byParent.get(p)!.push(n);
  }
  for (const arr of byParent.values()) {
    arr.sort((a, b) => a.sort_order - b.sort_order);
  }

  const build = (parentId: number): TreeDataNode[] => {
    const list = byParent.get(parentId) ?? [];
    return list.map((n) => ({
      title: n.name,
      key: n.id,
      children: build(n.id),
    }));
  };

  const treeData: TreeDataNode[] = [
    {
      title: root.name,
      key: root.id,
      children: build(root.id),
    },
  ];

  return { root, treeData };
}

export function orgNodesToIdTitleMap(nodes: IOrgNode[]): Map<number, string> {
  return new Map(nodes.map((n) => [n.id, n.name]));
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

/** TreeSelect：含 value 字段供选择 */
export function buildOrgNodesTreeSelectData(nodes: IOrgNode[]) {
  const { treeData } = buildOrgNodesTreeData(nodes);
  const addValue = (data: TreeDataNode[]): TreeDataNode[] =>
    data.map((n) => ({
      ...n,
      value: Number(n.key),
      children: n.children?.length
        ? addValue(n.children as TreeDataNode[])
        : undefined,
    }));
  return addValue(treeData);
}
