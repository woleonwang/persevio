import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import {
  Button,
  Form,
  Input,
  Modal,
  Space,
  Tooltip,
  TreeSelect,
  message,
} from "antd";
import type { TreeSelectProps } from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";

import { Get, Post } from "@/utils/request";
import globalStore from "@/store/global";
import {
  buildOrgNodesTreeData,
  collectTreeExpandKeysForVisibleLevels,
  OrgNodeTreeData,
} from "@/utils/orgNodes";

import styles from "./style.module.less";

export type OrgNodeTreeSelectProps = Omit<
  TreeSelectProps,
  "treeData" | "loading" | "multiple"
> & {
  multiple?: boolean;
  /** Admin 在下拉树节点行尾展示「添加子部门 / 编辑」 */
  allowCreate?: boolean;
  /** 节点列表加载完成后回调，便于表单拼文案等 */
  onCatalogLoaded?: (nodes: IOrgNode[]) => void;
};

const OrgNodeTreeSelect = observer((props: OrgNodeTreeSelectProps) => {
  const {
    multiple,
    allowCreate = false,
    onCatalogLoaded,
    allowClear = false,
    showSearch = true,
    treeLine = { showLeafIcon: false },
    placeholder,
    popupClassName,
    dropdownStyle,
    ...rest
  } = props;

  const { t } = useTranslation(undefined, { keyPrefix: "member_team" });
  const { staffRole, visibleOrgNodeIds, orgNodeId } = globalStore;

  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<OrgNodeTreeData[]>([]);
  const [treeExpandedKeys, setTreeExpandedKeys] = useState<number[]>([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [addForm] = Form.useForm();

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState<number | null>(null);
  const [renameForm] = Form.useForm();

  useEffect(() => {
    fetchOrgNodes();
  }, []);

  const showTreeActions = allowCreate && staffRole === "admin";

  const fetchOrgNodes = async () => {
    setLoading(true);
    const res = await Get<{ org_nodes: IOrgNode[] }>("/api/org_nodes");
    if (res.code === 0 && res.data?.org_nodes?.length) {
      const nodes = res.data.org_nodes;
      const { treeData } =
        staffRole === "recruiter"
          ? buildOrgNodesTreeData(
              nodes,
              Array.from(
                new Set(
                  [orgNodeId, ...visibleOrgNodeIds].filter((id) => id > 0),
                ),
              ),
            )
          : buildOrgNodesTreeData(nodes);
      setTreeData(treeData);
      onCatalogLoaded?.(nodes);
      setTreeExpandedKeys(collectTreeExpandKeysForVisibleLevels(treeData));
    } else {
      setTreeData([]);
      onCatalogLoaded?.([]);
    }
    setLoading(false);
  };

  const showAddChild = (parentId: number) => {
    setAddParentId(parentId);
    addForm.resetFields();
    setAddModalOpen(true);
  };

  const showRename = (id: number, name: string) => {
    setRenameNodeId(id);
    renameForm.setFieldsValue({ name });
    setRenameModalOpen(true);
  };

  const submitAdd = async () => {
    const values = await addForm.validateFields();
    const name = (values.name as string).trim();
    if (!name || addParentId === null) return;
    const { code } = await Post("/api/org_nodes", {
      name,
      parent_id: addParentId,
    });
    if (code === 0) {
      message.success(t("teamCreateSuccess"));
      setAddModalOpen(false);
      await fetchOrgNodes();
      if (!treeExpandedKeys.includes(addParentId)) {
        setTreeExpandedKeys((prev) => [...prev, addParentId]);
      }
    } else if (code === 10003) {
      message.error(t("maxDepthExceeded"));
    } else {
      message.error(t("teamCreateFailed"));
    }
  };

  const submitRename = async () => {
    const values = await renameForm.validateFields();
    const name = (values.name as string).trim();
    if (!name || renameNodeId === null) return;
    const { code } = await Post(`/api/org_nodes/${renameNodeId}`, {
      name,
    });
    if (code === 0) {
      message.success(t("renameSuccess"));
      setRenameModalOpen(false);
      await fetchOrgNodes();
    } else {
      message.error(t("renameFailed"));
    }
  };

  return (
    <>
      <TreeSelect
        className={styles.orgTreeSelect}
        allowClear={allowClear}
        showSearch={showSearch}
        treeLine={treeLine}
        loading={loading}
        treeData={treeData}
        treeExpandedKeys={treeExpandedKeys}
        treeTitleRender={(node) => {
          const id = node.key as number;
          const titleText = node.title as string;
          return (
            <span className={styles.treeNodeRow}>
              <span className={styles.treeNodeTitle}>{titleText}</span>
              {showTreeActions && (
                <span className={styles.treeNodeActions}>
                  <Space size={4}>
                    <Tooltip title={t("addChild")}>
                      <Button
                        type="link"
                        size="small"
                        icon={<PlusOutlined />}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          showAddChild(id);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={t("rename")}>
                      <Button
                        type="link"
                        size="small"
                        icon={<EditOutlined />}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          showRename(id, titleText);
                        }}
                      />
                    </Tooltip>
                  </Space>
                </span>
              )}
            </span>
          );
        }}
        onTreeExpand={(keys) => {
          setTreeExpandedKeys(Array.from(new Set(keys as number[])));
        }}
        multiple={multiple}
        treeCheckable={multiple}
        treeCheckStrictly={multiple}
        placeholder={placeholder}
        labelInValue={false}
        popupClassName={[styles.treeSelectDropdown, popupClassName]
          .filter(Boolean)
          .join(" ")}
        dropdownStyle={{ minWidth: 320, ...dropdownStyle }}
        filterTreeNode={(input, node) => {
          return (node.filterOption as string)
            .toLowerCase()
            .includes(input.toLowerCase());
        }}
        {...rest}
      />

      {showTreeActions && (
        <>
          <Modal
            title={t("addChildModalTitle")}
            open={addModalOpen}
            onOk={submitAdd}
            onCancel={() => setAddModalOpen(false)}
            okText={t("confirm")}
            cancelText={t("cancel")}
          >
            <Form form={addForm} layout="vertical">
              <Form.Item
                name="name"
                label={t("nodeName")}
                rules={[{ required: true, message: t("nodeNameRequired") }]}
              >
                <Input placeholder={t("nodeNamePlaceholder")} />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title={t("renameModalTitle")}
            open={renameModalOpen}
            onOk={submitRename}
            onCancel={() => setRenameModalOpen(false)}
            okText={t("confirm")}
            cancelText={t("cancel")}
          >
            <Form form={renameForm} layout="vertical">
              <Form.Item
                name="name"
                label={t("nodeName")}
                rules={[{ required: true, message: t("nodeNameRequired") }]}
              >
                <Input placeholder={t("nodeNamePlaceholder")} />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </>
  );
});

export default OrgNodeTreeSelect;
