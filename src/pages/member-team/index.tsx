import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Tree,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { DataNode, TreeProps } from "antd/es/tree";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import OrgNodeTreeSelect from "@/components/OrgNodeTreeSelect";
import { Delete, Get, Post } from "@/utils/request";
import { copy } from "@/utils";
import {
  buildOrgNodesTreeData,
  collectDescendantOrgNodeIds,
  collectTreeExpandKeysForVisibleLevels,
  findParentKey,
  orgNodesToIdTitleMap,
} from "@/utils/orgNodes";

import styles from "./style.module.less";
import useStaffs from "@/hooks/useStaffs";
import globalStore from "@/store/global";

const { Option } = Select;
const PAGE_SIZE = 10;

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

const normalizeRole = (role: string) =>
  role === "normal" ? "recruiter" : role;

const normalizeIntArray = (v: unknown): number[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (typeof item === "number") return item;
      if (typeof item === "string") return Number(item);
      if (item && typeof item === "object" && "value" in item) {
        return Number((item as { value: unknown }).value);
      }
      return NaN;
    })
    .filter((n): n is number => !Number.isNaN(n));
};

const normalizeIntOrZero = (v: unknown): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (v && typeof v === "object" && "value" in v) {
    return Number((v as { value: unknown }).value);
  }
  return 0;
};

const MemberTeamPage = () => {
  const [orgLoading, setOrgLoading] = useState(true);
  const { isAdmin: currentUserIsAdmin, email: currentUserEmail } = globalStore;

  /** 左侧部门树 相关 state */
  const [treeData, setTreeData] = useState<DataNode[]>([]); // 部门树数据
  const [orgNodes, setOrgNodes] = useState<IOrgNode[]>([]); // 部门列表
  const [rootId, setRootId] = useState<number | null>(null); // 根部门ID
  const [expandedKeys, setExpandedKeys] = useState<number[]>([]); // 展开的部门
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]); // 选中的部门

  /** 右侧成员列表 相关 state */
  const { staffs, fetchStaffs } = useStaffs({ includeDeactivated: true }); // 全量员工列表
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  /** 添加部门 modal 相关 state */
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<number | null>(null);
  const [addForm] = Form.useForm();

  /** 重命名部门 modal 相关 state */
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameNodeId, setRenameNodeId] = useState<number | null>(null);
  const [renameForm] = Form.useForm();

  /** 添加/编辑成员 modal 相关 state */
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStaff, setEditingStaff] = useState<IStaffWithAccount | null>(
    null,
  );
  const [memberForm] = Form.useForm();
  const memberRole = Form.useWatch("role", memberForm);
  const [createdStaffInfo, setCreatedStaffInfo] = useState<{
    name: string;
    email: string;
    password: string;
  }>();

  const orgNodeNameById = useMemo(
    () => orgNodesToIdTitleMap(orgNodes),
    [orgNodes],
  );

  const { t: originalT, i18n } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`member_team.${key}`, params);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    setOrgLoading(true);
    const { code, data } = await Get<{ org_nodes: IOrgNode[] }>(
      "/api/org_nodes",
    );
    if (code === 0 && data?.org_nodes) {
      setOrgNodes(data.org_nodes);
      const nodeIds = new Set(data.org_nodes.map((n) => n.id));
      const { root, treeData: td } = buildOrgNodesTreeData(data.org_nodes);
      setTreeData(td);
      if (root) {
        setRootId(root.id);
        setExpandedKeys((prev) =>
          prev.length ? prev : collectTreeExpandKeysForVisibleLevels(td),
        );
        setSelectedKeys((prev) => {
          const valid = prev.filter((k) => nodeIds.has(k));
          if (valid.length) return valid;
          return [root.id];
        });
      } else {
        setRootId(null);
        setSelectedKeys([]);
      }
    }
    setOrgLoading(false);
  };

  const selectedNodeId = useMemo(() => {
    const k = selectedKeys[0];
    if (k == null) return null;
    const id = Number(k);
    return Number.isNaN(id) ? null : id;
  }, [selectedKeys]);

  const selectedNodeName = useMemo(() => {
    if (selectedNodeId == null) return "";
    return orgNodes.find((n) => n.id === selectedNodeId)?.name ?? "";
  }, [selectedNodeId, orgNodes]);

  const scopedOrgNodeIds = useMemo(() => {
    if (selectedNodeId == null) return null;
    return collectDescendantOrgNodeIds(selectedNodeId, treeData as DataNode[]);
  }, [selectedNodeId, treeData]);

  const membersForSelectedScope = useMemo(() => {
    if (scopedOrgNodeIds == null) return [];
    return staffs.filter(
      (s) =>
        (!s.org_node_id && selectedNodeId === rootId) ||
        scopedOrgNodeIds.has(s.org_node_id ?? 0),
    );
  }, [staffs, scopedOrgNodeIds]);

  const visibleMembers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return membersForSelectedScope;
    return membersForSelectedScope.filter(
      (staff) =>
        staff.name.toLowerCase().includes(keyword) ||
        staff.account.username.toLowerCase().includes(keyword),
    );
  }, [membersForSelectedScope, searchTerm]);

  const paginatedMembers = useMemo(
    () => visibleMembers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visibleMembers, page],
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

    const dragKeyStr = Number(dragKey);
    const parentKey = findParentKey(treeData as DataNode[], dragKeyStr);

    (async () => {
      const newParentId = Number(parentKey);
      const { code } = await Post(`/api/org_nodes/${dragKeyStr}`, {
        parent_id: Number(parentKey),
        sort_order: dropIndex,
      });
      if (code === 0) {
        message.success(t("teamUpdateSuccess"));
        await fetchNodes();
        const keysToExpand: number[] = [];
        let curKey: number | null = newParentId;
        while (curKey) {
          keysToExpand.push(curKey);
          const p = findParentKey(treeData as DataNode[], curKey);
          curKey = p;
        }
        setExpandedKeys((prev) =>
          Array.from(new Set([...prev, ...keysToExpand])),
        );
      } else if (code === 10003) {
        message.error(t("maxDepthExceeded"));
        await fetchNodes();
      } else {
        message.error(t("teamUpdateFailed"));
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
      message.success(t("teamCreateSuccess"));
      setAddModalOpen(false);
      await fetchNodes();
      if (!expandedKeys.includes(addParentId)) {
        setExpandedKeys((prev) => [...prev, addParentId]);
      }
    } else if (code === 10003) {
      message.error(t("maxDepthExceeded"));
    } else {
      message.error(t("teamCreateFailed"));
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

  const handleDeleteNode = (id: number, title: React.ReactNode) => {
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

  const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let password = "";
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    memberForm.setFieldsValue({ password });
  };

  const showCreateMemberModal = () => {
    setIsEditMode(false);
    setEditingStaff(null);
    setIsMemberModalOpen(true);
    memberForm.resetFields();
    generatePassword();
    memberForm.setFieldsValue({
      role: "recruiter",
      org_node_id: selectedNodeId ?? undefined,
    });
  };

  const showEditMemberModal = async (staff: IStaffWithAccount) => {
    setIsEditMode(true);
    setEditingStaff(staff);
    setIsMemberModalOpen(true);

    let visibility: number[] = [];
    const detailRes = await Get<{ staff: IStaffWithAccount }>(
      `/api/staffs/${staff.id}`,
    );
    if (detailRes.code === 0 && detailRes.data?.staff) {
      visibility = detailRes.data.staff.visibility_org_node_ids ?? [];
    }

    memberForm.setFieldsValue({
      name: staff.name,
      email: staff.account.username,
      role: normalizeRole(staff.role),
      org_node_id: staff.org_node_id ?? undefined,
      visibility_org_node_ids: visibility,
    });
  };

  const handleMemberModalCancel = () => {
    setIsMemberModalOpen(false);
    setIsEditMode(false);
    setEditingStaff(null);
    memberForm.resetFields();
  };

  const copyToClipboard = async () => {
    if (!createdStaffInfo) return;
    const loginUrl = `${window.location.origin}/signin`;
    const copyText = t("loginInfoTemplate", {
      loginUrl,
      name: createdStaffInfo.name,
      email: createdStaffInfo.email,
      password: createdStaffInfo.password,
    });
    await copy(copyText);
    message.success(t("copySuccess"));
  };

  const handleCreateMember = async () => {
    try {
      const values = await memberForm.validateFields();
      const createData: Record<string, unknown> = {
        username: values.email,
        password: values.password,
        name: values.name,
        role: values.role,
      };
      if (values.org_node_id != null) {
        createData.org_node_id = normalizeIntOrZero(values.org_node_id);
      }
      if (
        values.role === "recruiter" &&
        values.visibility_org_node_ids?.length
      ) {
        createData.visibility_org_node_ids = normalizeIntArray(
          values.visibility_org_node_ids,
        );
      }

      const { code } = await Post("/api/staffs", createData);
      if (code === 0) {
        setCreatedStaffInfo({
          name: values.name,
          email: values.email,
          password: values.password,
        });
        setIsMemberModalOpen(false);
        memberForm.resetFields();
        setIsSuccessModalVisible(true);
        await fetchStaffs();
      } else if (code === 10002) {
        message.error(t("staffExists"));
      } else {
        message.error(t("memberCreateFailed"));
      }
    } catch {
      // validation failed
    }
  };

  const handleUpdateMember = async () => {
    try {
      const values = await memberForm.validateFields();
      if (!editingStaff) return;

      const updateData: Record<string, unknown> = {
        name: values.name,
        role: values.role,
        org_node_id: normalizeIntOrZero(values.org_node_id),
      };
      if (values.role === "recruiter") {
        updateData.visibility_org_node_ids = normalizeIntArray(
          values.visibility_org_node_ids,
        );
      }

      const { code } = await Post(`/api/staffs/${editingStaff.id}`, updateData);
      if (code === 0) {
        message.success(t("memberUpdateSuccess"));
        handleMemberModalCancel();
        await fetchStaffs();
      } else {
        message.error(t("memberUpdateFailed"));
      }
    } catch {
      // validation failed
    }
  };

  const handleToggleStatus = async (
    record: IStaffWithAccount,
    nextStatus: "active" | "deactivated",
  ) => {
    const action = nextStatus === "deactivated" ? "deactivate" : "activate";
    const { code } = await Post(`/api/staffs/${record.id}/${action}`, {});
    if (code === 0) {
      message.success(
        nextStatus === "deactivated"
          ? t("deactivateSuccess")
          : t("activateSuccess"),
      );
      await fetchStaffs();
      return;
    }
    message.error(t("toggleStatusFailed"));
  };

  const showDeactivateConfirm = (record: IStaffWithAccount) => {
    Modal.confirm({
      title: t("deactivateConfirmTitle", { name: record.name }),
      content: t("deactivateConfirmDesc"),
      okText: t("deactivate"),
      cancelText: t("cancel"),
      okButtonProps: { danger: true },
      onOk: async () => {
        await handleToggleStatus(record, "deactivated");
      },
    });
  };

  const renderRoleLabel = (r: string) => {
    if (r === "admin") return t("admin");
    if (r === "hiring_manager") return t("hiring_manager");
    if (r === "recruiter" || r === "normal") return t("recruiter");
    return t("normal");
  };

  const renderStatusTag = (status?: string) => {
    if (status === "deactivated") {
      return <Tag>{t("deactivated")}</Tag>;
    }
    return <Tag color="success">{t("active")}</Tag>;
  };

  const memberColumns: ColumnsType<IStaffWithAccount> = useMemo(
    () => [
      {
        title: t("id"),
        dataIndex: "id",
        key: "id",
        width: 80,
      },
      {
        title: t("name"),
        dataIndex: "name",
        key: "name",
        width: 120,
      },
      {
        title: t("email"),
        key: "email",
        width: 200,
        render: (_: unknown, row) => row.account?.username ?? "—",
      },
      {
        title: t("role"),
        dataIndex: "role",
        key: "role",
        width: 140,
        render: (r: string) => renderRoleLabel(r),
      },
      {
        title: t("team"),
        key: "team",
        width: 140,
        render: (_: unknown, row) =>
          row.org_node_id != null
            ? (orgNodeNameById.get(row.org_node_id) ?? "—")
            : "—",
      },
      {
        title: t("status"),
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status: string) => renderStatusTag(status),
      },
      {
        title: t("action"),
        key: "action",
        width: 200,
        render: (_: unknown, record) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={() => showEditMemberModal(record)}
            >
              {t("edit")}
            </Button>
            {currentUserIsAdmin &&
              record.account.username !== currentUserEmail &&
              (record.status === "deactivated" ? (
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleToggleStatus(record, "active")}
                >
                  {t("activate")}
                </Button>
              ) : (
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={() => showDeactivateConfirm(record)}
                >
                  {t("deactivate")}
                </Button>
              ))}
          </Space>
        ),
      },
    ],
    [currentUserEmail, currentUserIsAdmin, orgNodeNameById, i18n.language],
  );

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
        <span className={styles.treeNodeActions}>
          <Space size={4}>
            <Tooltip title={t("addChild")}>
              <Button
                type="link"
                size="small"
                icon={<PlusOutlined />}
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
                onClick={(e) => {
                  e.stopPropagation();
                  showRename(id, titleText);
                }}
              />
            </Tooltip>
            {!isRoot && (
              <Tooltip title={t("delete")}>
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNode(id, titleText);
                  }}
                />
              </Tooltip>
            )}
          </Space>
        </span>
      </span>
    );
  };

  if (orgLoading && !treeData.length) {
    return (
      <div className={styles.memberTeamPage}>
        <Spin style={{ margin: 48 }} />
      </div>
    );
  }

  return (
    <div className={styles.memberTeamPage}>
      <div className={styles.headerSection}>
        <h1 className={styles.pageTitle}>{t("title")}</h1>
      </div>

      <div className={styles.mainBody}>
        <div className={styles.treeColumn}>
          <div className={styles.treeScroll}>
            {treeData.length === 0 ? (
              <div>{t("empty")}</div>
            ) : (
              <Tree
                draggable={
                  rootId !== null
                    ? ({ key }) => String(key) !== String(rootId)
                    : false
                }
                blockNode
                expandedKeys={expandedKeys}
                onExpand={(keys) => {
                  setExpandedKeys(keys.map(Number));
                }}
                selectedKeys={selectedKeys}
                onSelect={(keys) => {
                  if (keys.length > 0) {
                    setSelectedKeys(keys.map(Number));
                    setPage(1);
                  }
                }}
                treeData={treeData}
                onDrop={onDrop}
                titleRender={titleRender}
              />
            )}
          </div>
        </div>

        <div className={styles.membersColumn}>
          <div className={styles.membersColumnHeader}>{t("membersTitle")}</div>
          {selectedNodeId == null ? (
            <div className={styles.membersColumnSub}>
              {t("selectOrgNodeHint")}
            </div>
          ) : (
            <>
              <div className={styles.membersColumnSub}>
                {t("membersSubtitle", {
                  name: selectedNodeName,
                  count: String(membersForSelectedScope.length),
                })}
              </div>

              <div className={styles.filterSection}>
                <div className={styles.searchSection}>
                  <Input
                    placeholder={t("searchPlaceholder")}
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    className={styles.searchInput}
                    allowClear
                  />
                </div>
                <div className={styles.actionSection}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showCreateMemberModal}
                  >
                    {t("createMember")}
                  </Button>
                </div>
              </div>

              <div className={styles.tableWrap}>
                <Table<IStaffWithAccount>
                  columns={memberColumns}
                  dataSource={paginatedMembers}
                  rowKey="id"
                  pagination={{
                    current: page,
                    total: visibleMembers.length,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      i18n.t("pagination_total", {
                        rangeStart: String(range[0]),
                        rangeEnd: String(range[1]),
                        total: String(total),
                      }),
                    pageSize: PAGE_SIZE,
                    onChange: (p) => setPage(p),
                  }}
                  locale={{
                    emptyText: t("membersEmpty"),
                  }}
                />
              </div>
            </>
          )}
        </div>
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

      <Modal
        title={isEditMode ? t("editMember") : t("createMember")}
        open={isMemberModalOpen}
        onOk={isEditMode ? handleUpdateMember : handleCreateMember}
        onCancel={handleMemberModalCancel}
        okText={isEditMode ? t("update") : t("confirm")}
        cancelText={t("cancel")}
        width={560}
      >
        <Form
          form={memberForm}
          layout="vertical"
          initialValues={{ role: "recruiter" }}
        >
          <Form.Item
            label={t("name")}
            name="name"
            rules={[{ required: true, message: t("nameRequired") }]}
          >
            <Input placeholder={t("namePlaceholder")} />
          </Form.Item>

          <Form.Item
            label={t("email")}
            name="email"
            rules={[
              { required: true, message: t("emailRequired") },
              { type: "email", message: t("emailInvalid") },
            ]}
          >
            <Input placeholder={t("emailPlaceholder")} disabled={isEditMode} />
          </Form.Item>

          <Form.Item
            label={t("role")}
            name="role"
            rules={[{ required: true, message: t("roleRequired") }]}
          >
            <Select placeholder={t("rolePlaceholder")}>
              <Option value="admin">{t("admin")}</Option>
              <Option value="recruiter">{t("recruiter")}</Option>
              <Option value="hiring_manager">{t("hiring_manager")}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={t("orgNode")}
            name="org_node_id"
            rules={[{ required: true, message: t("orgNodeRequired") }]}
          >
            <OrgNodeTreeSelect
              style={{ width: "100%" }}
              placeholder={t("orgNodePlaceholder")}
            />
          </Form.Item>

          {memberRole === "recruiter" && (
            <Form.Item
              label={t("visibilityScope")}
              name="visibility_org_node_ids"
            >
              <OrgNodeTreeSelect
                style={{ width: "100%" }}
                multiple
                placeholder={t("visibilityPlaceholder")}
                allowClear
              />
            </Form.Item>
          )}

          {!isEditMode && (
            <Form.Item
              label={t("passwordLabel")}
              name="password"
              rules={[{ required: true, message: t("passwordRequired") }]}
            >
              <Input readOnly />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title=""
        open={isSuccessModalVisible}
        onCancel={() => {
          setIsSuccessModalVisible(false);
          setCreatedStaffInfo(undefined);
        }}
        footer={[
          <Button key="copy" type="primary" onClick={copyToClipboard}>
            {t("copyLoginInfo")}
          </Button>,
          <Button
            key="done"
            type="primary"
            onClick={() => {
              setIsSuccessModalVisible(false);
              setCreatedStaffInfo(undefined);
            }}
          >
            {t("confirm")}
          </Button>,
        ]}
        width={400}
        closable={false}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <CheckCircleOutlined
            style={{ fontSize: 24, color: "#52c41a", marginTop: 2 }}
          />
          <p style={{ margin: 0, fontSize: 16 }}>{t("successMessage")}</p>
        </div>
      </Modal>
    </div>
  );
};

export default MemberTeamPage;
