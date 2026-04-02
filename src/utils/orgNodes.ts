import type { TreeDataNode } from "antd";

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
      key: String(n.id),
      children: build(n.id),
    }));
  };

  const treeData: TreeDataNode[] = [
    {
      title: root.name,
      key: String(root.id),
      children: build(root.id),
    },
  ];

  return { root, treeData };
}

export function orgNodesToIdTitleMap(nodes: IOrgNode[]): Map<number, string> {
  return new Map(nodes.map((n) => [n.id, n.name]));
}

/** 查找节点父级 key；根节点返回 null */
export function findParentKey(
  tree: TreeDataNode[],
  targetKey: string,
): string | null {
  for (const node of tree) {
    const children = node.children as TreeDataNode[] | undefined;
    if (children?.some((c) => String(c.key) === targetKey)) {
      return String(node.key);
    }
    if (children?.length) {
      const r = findParentKey(children, targetKey);
      if (r !== null) return r;
    }
  }
  return null;
}

/** 与目标同父的兄弟节点 key 顺序（含自身） */
export function findSiblingKeys(
  tree: TreeDataNode[],
  targetKey: string,
): string[] | null {
  for (const node of tree) {
    if (String(node.key) === targetKey) {
      return tree.map((n) => String(n.key));
    }
    const children = node.children as TreeDataNode[] | undefined;
    if (children?.length) {
      if (children.some((c) => String(c.key) === targetKey)) {
        return children.map((c) => String(c.key));
      }
      const r = findSiblingKeys(children, targetKey);
      if (r) return r;
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
