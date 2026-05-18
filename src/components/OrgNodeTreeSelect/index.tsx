import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { TreeSelect } from "antd";
import type { TreeDataNode, TreeSelectProps } from "antd";

import { Get } from "@/utils/request";
import globalStore from "@/store/global";
import {
  buildOrgNodesTreeData,
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

const OrgNodeTreeSelect = observer((props: OrgNodeTreeSelectProps) => {
  const {
    multiple,
    onCatalogLoaded,
    allowClear = false,
    showSearch = true,
    treeLine = { showLeafIcon: false },
    placeholder,
    ...rest
  } = props;

  const { staffRole, visibleOrgNodeIds, orgNodeId } = globalStore;

  const [loading, setLoading] = useState(true);
  const [orgNodes, setOrgNodes] = useState<IOrgNode[]>([]);
  const [treeExpandedKeys, setTreeExpandedKeys] = useState<number[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await Get<{ org_nodes: IOrgNode[] }>("/api/org_nodes");
      if (res.code === 0 && res.data?.org_nodes?.length) {
        const nodes = res.data.org_nodes;
        setOrgNodes(nodes);
        onCatalogLoaded?.(nodes);
      } else {
        setOrgNodes([]);
        onCatalogLoaded?.([]);
      }
      setLoading(false);
    })();
  }, []);

  const { treeData } = useMemo(() => {
    if (!orgNodes.length) return { treeData: [] };

    if (staffRole === "recruiter") {
      return buildOrgNodesTreeData(orgNodes, [orgNodeId, ...visibleOrgNodeIds]);
    } else {
      return buildOrgNodesTreeData(orgNodes);
    }
  }, [orgNodes, staffRole, orgNodeId, visibleOrgNodeIds]);

  useEffect(() => {
    if (!treeData.length) {
      setTreeExpandedKeys([]);
      return;
    }
    setTreeExpandedKeys(
      collectTreeExpandKeysForVisibleLevels(treeData as TreeDataNode[]),
    );
  }, [treeData]);

  return (
    <TreeSelect
      allowClear={allowClear}
      showSearch={showSearch}
      treeLine={treeLine}
      loading={loading}
      treeData={treeData}
      treeExpandedKeys={treeExpandedKeys}
      onTreeExpand={(keys) => {
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
});

export default OrgNodeTreeSelect;

export { orgNodesToIdTitleMap };
