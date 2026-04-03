import { useCallback, useEffect, useState } from "react";
import { Button, Form, Input, Modal, Space, Spin, Tree, message } from "antd";
import type { DataNode, TreeProps } from "antd/es/tree";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import { Delete, Get, Post } from "@/utils/request";
import { buildOrgNodesTreeData, findParentKey } from "@/utils/orgNodes";

import styles from "./style.module.less";

const loop = (
  data: DataNode[],
  key: React.Key,
  callback: (item: DataNode, index: number, arr: DataNode[]) => void,
) => {
  for (let i = 0; i < data.length; i++) {
    if (data[i].key === key) {
      return callback(data[i], i, data);
    }
    if (data[i].children) {
      loop(data[i].children!, key, callback);
    }
  }
};

const OrgChartPage = () => {
  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`org_chart.${key}`, params);

  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [orgNodes, setOrgNodes] = useState<IOrgNode[]>([]);
  const [rootId, setRootId] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [addForm] = Form.useForm();

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState<number | null>(null);
  const [renameForm] = Form.useForm();

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    const { code, data } = await Get<{ org_nodes: IOrgNode[] }>(
      "/api/org_nodes",
    );
    if (code === 0 && data?.org_nodes) {
      setOrgNodes(data.org_nodes);
      const { root, treeData: td } = buildOrgNodesTreeData(data.org_nodes);
      setTreeData(td as DataNode[]);
      if (root) {
        setRootId(root.id);
        // 不在每次刷新都强制仅展开根节点；避免编辑/删除后父节点被折叠
        setExpandedKeys((prev) => (prev.length ? prev : [String(root.id)]));
      } else {
        setRootId(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const expandPathTo = useCallback(
    (targetId: number) => {
      if (!orgNodes.length) return;
      const byId = new Map(orgNodes.map((n) => [n.id, n]));
      const keysToAdd: string[] = [];
      let cur = byId.get(targetId);
      while (cur) {
        keysToAdd.push(String(cur.id));
        if (cur.parent_id == null) break;
        cur = byId.get(cur.parent_id);
      }
      if (keysToAdd.length === 0) return;
      setExpandedKeys((prev) => Array.from(new Set([...prev, ...keysToAdd])));
    },
    [orgNodes],
  );

  const onDrop: TreeProps["onDrop"] = (info) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split("-");
    const dropPosition =
      info.dropPosition - Number(dropPos[dropPos.length - 1]);

    if (dragKey === dropKey) return;
    if (String(dragKey) === String(rootId)) {
      message.warning(t("cannotMoveRoot"));
      return;
    }

    let dragObj: DataNode;

    loop(treeData, dragKey, (item, index, arr) => {
      arr.splice(index, 1);
      dragObj = item;
    });

    let dropIndex = 0;
    if (!info.dropToGap) {
      loop(treeData, dropKey, (item) => {
        item.children = item.children || [];
        item.children.unshift(dragObj!);
        dropIndex = 0;
      });
    } else {
      let ar: DataNode[] = [];
      let i = 0;
      loop(treeData, dropKey, (_item, index, arr) => {
        ar = arr;
        i = index;
      });

      if (dropPosition === -1) {
        ar.splice(i, 0, dragObj!);
        dropIndex = i;
      } else {
        ar.splice(i + 1, 0, dragObj!);
        dropIndex = i + 1;
      }
    }

    const dragKeyStr = String(dragKey);
    const parentKey = findParentKey(treeData as DataNode[], dragKeyStr);

    void (async () => {
      const newParentId = Number(parentKey);
      const { code } = await Post(`/api/org_nodes/${dragKeyStr}`, {
        parent_id: Number(parentKey),
        sort_order: dropIndex,
      });
      if (code === 0) {
        message.success(t("updateSuccess"));
        await fetchNodes();
        // 展开拖拽后的新父节点链路，确保松手后立刻能看到结果
        const keysToExpand: string[] = [];
        let curKey: string | null = String(newParentId);
        while (curKey) {
          keysToExpand.push(curKey);
          const p = findParentKey(treeData as DataNode[], curKey);
          curKey = p;
        }
        setExpandedKeys((prev) =>
          Array.from(new Set([...prev, ...keysToExpand])),
        );
      } else {
        message.error(t("updateFailed"));
        await fetchNodes();
      }
    })();
  };

  const showAddChild = (parentId: number) => {
    setAddParentId(parentId);
    addForm.resetFields();
    setAddModalOpen(true);
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
      message.success(t("createSuccess"));
      setAddModalOpen(false);
      await fetchNodes();
      // 添加成功后自动展开父节点（以及其祖先路径，确保能看到该父节点）。
      expandPathTo(addParentId);
    } else {
      message.error(t("createFailed"));
    }
  };

  const showRename = (id: number, name: string) => {
    setRenameNodeId(id);
    renameForm.setFieldsValue({ name });
    setRenameModalOpen(true);
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
      await fetchNodes();
    } else {
      message.error(t("renameFailed"));
    }
  };

  const handleDelete = (id: number, title: React.ReactNode) => {
    Modal.confirm({
      title: t("deleteTitle"),
      content: t("deleteConfirm", { name: String(title) }),
      onOk: async () => {
        const { code } = await Delete(`/api/org_nodes/${id}`);
        if (code === 0) {
          message.success(t("deleteSuccess"));
          await fetchNodes();
        } else {
          message.error(t("deleteFailed"));
        }
      },
    });
  };

  const titleRender = (nodeData: DataNode) => {
    const id = Number(nodeData.key);
    const isRoot = rootId !== null && id === rootId;
    const titleText =
      typeof nodeData.title === "string"
        ? nodeData.title
        : String(nodeData.key);

    return (
      <span className={styles.treeNodeRow}>
        <span className={styles.treeNodeTitle}>{titleText}</span>
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<PlusOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              showAddChild(id);
            }}
          />
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              showRename(id, titleText);
            }}
          />
          {!isRoot && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(id, titleText);
              }}
            />
          )}
        </Space>
      </span>
    );
  };

  if (loading && !treeData.length) {
    return (
      <div className={styles.orgChartPage}>
        <Spin style={{ margin: 48 }} />
      </div>
    );
  }

  return (
    <div className={styles.orgChartPage}>
      <div className={styles.headerSection}>
        <div className={styles.pageTitle}>{t("title")}</div>
      </div>

      <div className={styles.treeSection}>
        {treeData.length === 0 ? (
          <div>{t("empty")}</div>
        ) : (
          <Tree
            className="draggableTree"
            draggable={
              rootId !== null
                ? ({ key }) => String(key) !== String(rootId)
                : false
            }
            blockNode
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            treeData={treeData}
            onDrop={onDrop}
            titleRender={titleRender}
          />
        )}
      </div>

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
            rules={[{ required: true, message: t("nameRequired") }]}
          >
            <Input placeholder={t("namePlaceholder")} />
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
            rules={[{ required: true, message: t("nameRequired") }]}
          >
            <Input placeholder={t("namePlaceholder")} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OrgChartPage;
