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
  /** 默认 `/api/org_nodes`；StaffChat 等可传入 formatUrl */
  formatUrl?: (url: string) => string;
  multiple?: boolean;
  /** 节点列表加载完成后回调，便于表单拼文案等 */
  onCatalogLoaded?: (nodes: IOrgNode[]) => void;
};

const OrgNodeTreeSelect = (props: OrgNodeTreeSelectProps) => {
  const {
    formatUrl = (u: string) => u,
    multiple,
    onCatalogLoaded,
    allowClear = true,
    showSearch = true,
    treeLine = { showLeafIcon: false },
    placeholder,
    ...rest
  } = props;

  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<TreeSelectProps["treeData"]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await Get<{ org_nodes: IOrgNode[] }>(
          formatUrl("/api/org_nodes"),
        );
        if (cancelled) return;
        if (res.code === 0 && res.data?.org_nodes?.length) {
          const nodes = res.data.org_nodes;
          setTreeData(buildOrgNodesTreeSelectData(nodes));
          onCatalogLoaded?.(nodes);
        } else {
          setTreeData([]);
          onCatalogLoaded?.([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onCatalogLoaded 由父组件稳定化或仅用于首屏回调
  }, [formatUrl]);

  return (
    <TreeSelect
      allowClear={allowClear}
      showSearch={showSearch}
      treeLine={treeLine}
      loading={loading}
      treeData={treeData}
      multiple={multiple}
      treeCheckable={multiple}
      showCheckedStrategy={TreeSelect.SHOW_ALL}
      placeholder={placeholder}
      {...rest}
    />
  );
};

export default OrgNodeTreeSelect;

export { orgNodesToIdTitleMap };
