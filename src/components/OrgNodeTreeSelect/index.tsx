import { useEffect, useRef, useState } from "react";
import { TreeSelect } from "antd";
import type { TreeDataNode, TreeSelectProps } from "antd";

import { Get } from "@/utils/request";
import {
  buildOrgNodesTreeSelectData,
  collectTreeExpandKeysForVisibleLevels,
  orgNodesToIdTitleMap,
} from "@/utils/orgNodes";

export type OrgNodeTreeSelectProps = Omit<
  TreeSelectProps,
  "treeData" | "loading" | "multiple"
> & {
  multiple?: boolean;
  /** 节点列表加载完成后回调，便于表单拼文案等 */
  onCatalogLoaded?: (nodes: IOrgNode[]) => void;
};

const OrgNodeTreeSelect = (props: OrgNodeTreeSelectProps) => {
  const {
    multiple,
    onCatalogLoaded,
    allowClear = false,
    showSearch = true,
    treeLine = { showLeafIcon: false },
    placeholder,
    ...rest
  } = props;

  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<TreeSelectProps["treeData"]>([]);
  const [treeExpandedKeys, setTreeExpandedKeys] = useState<number[]>([]);
  const hasAppliedDefaultExpandRef = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      hasAppliedDefaultExpandRef.current = false;
      const res = await Get<{ org_nodes: IOrgNode[] }>("/api/org_nodes");
      if (res.code === 0 && res.data?.org_nodes?.length) {
        const nodes = res.data.org_nodes;
        const treeData = buildOrgNodesTreeSelectData(nodes);
        const expandedKeys = collectTreeExpandKeysForVisibleLevels(
          treeData as unknown as TreeDataNode[],
        );
        setTreeData(treeData);
        onCatalogLoaded?.(nodes);
        setTreeExpandedKeys(expandedKeys);
      } else {
        setTreeData([]);
        onCatalogLoaded?.([]);
      }
      setLoading(false);
    })();
  }, []);

  console.log("treeExpandedKeys", treeExpandedKeys);
  return (
    <TreeSelect
      allowClear={allowClear}
      showSearch={showSearch}
      treeLine={treeLine}
      loading={loading}
      treeData={treeData}
      treeExpandedKeys={treeExpandedKeys}
      onTreeExpand={(keys) => {
        console.log("keys", keys);
        setTreeExpandedKeys(Array.from(new Set(keys as number[])));
      }}
      multiple={multiple}
      treeCheckable={multiple}
      treeCheckStrictly={multiple}
      placeholder={placeholder}
      labelInValue={false}
      {...rest}
    />
  );
};

export default OrgNodeTreeSelect;

export { orgNodesToIdTitleMap };
