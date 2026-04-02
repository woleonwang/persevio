import { useEffect, useState } from "react";
import { TreeSelect } from "antd";
import type { TreeSelectProps } from "antd";

import { Get } from "@/utils/request";
import {
  buildOrgNodesTreeSelectData,
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
  const { multiple, onCatalogLoaded, allowClear = true, showSearch = true } =
    props;
  const { treeLine = { showLeafIcon: false }, placeholder, ...rest } = props;

  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<TreeSelectProps["treeData"]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await Get<{ org_nodes: IOrgNode[] }>("/api/org_nodes");
      if (res.code === 0 && res.data?.org_nodes?.length) {
        const nodes = res.data.org_nodes;
        setTreeData(buildOrgNodesTreeSelectData(nodes));
        onCatalogLoaded?.(nodes);
      } else {
        setTreeData([]);
        onCatalogLoaded?.([]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <TreeSelect
      allowClear={allowClear}
      showSearch={showSearch}
      treeLine={treeLine}
      loading={loading}
      treeData={treeData}
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
