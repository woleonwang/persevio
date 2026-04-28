import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  Tag,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Get, Post } from "@/utils/request";
import OrgNodeTreeSelect from "@/components/OrgNodeTreeSelect";
import styles from "./style.module.less";
import { copy } from "@/utils";
import { useTranslation } from "react-i18next";

const { Option } = Select;

const PAGE_SIZE = 10;

const normalizeRole = (role: string) =>
  role === "normal" ? "recruiter" : role;

const normalizeIntArray = (v: unknown): number[] => {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (typeof item === "number") return item;
      if (typeof item === "string") return Number(item);
      if (item && typeof item === "object" && "value" in item) {
        // antd TreeSelect when labelInValue=true
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

const Staffs: React.FC = () => {
  const [staffs, setStaffs] = useState<IStaffWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStaff, setEditingStaff] = useState<IStaffWithAccount | null>(
    null,
  );
  const [form] = Form.useForm();
  const role = Form.useWatch("role", form);
  const [page, setPage] = useState(1);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [createdStaffInfo, setCreatedStaffInfo] = useState<{
    name: string;
    email: string;
    password: string;
  }>();

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) => {
    return originalT(`staffs.${key}`, params);
  };

  const fetchStaffs = async () => {
    setLoading(true);
    const { code, data } = await Get<{ staffs: IStaffWithAccount[] }>(
      "/api/staffs",
    );
    if (code === 0) {
      setStaffs(data.staffs ?? []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStaffs();
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    const { code, data } = await Get<ISettings>("/api/settings");
    if (code === 0) {
      setCurrentUserEmail(data.email ?? "");
      setCurrentUserIsAdmin(data.is_admin === 1);
    }
  };

  const visibleStaffs = staffs.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.account.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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

    form.setFieldsValue({ password: password });
  };

  const showCreateModal = () => {
    setIsEditMode(false);
    setEditingStaff(null);
    setIsModalVisible(true);
    form.resetFields();
    generatePassword();
    form.setFieldsValue({ role: "recruiter" });
  };

  const showEditModal = async (staff: IStaffWithAccount) => {
    setIsEditMode(true);
    setEditingStaff(staff);
    setIsModalVisible(true);

    let visibility: number[] = [];
    const detailRes = await Get<{ staff: IStaffWithAccount }>(
      `/api/staffs/${staff.id}`,
    );
    if (detailRes.code === 0 && detailRes.data?.staff) {
      visibility = detailRes.data.staff.visibility_org_node_ids ?? [];
    }

    form.setFieldsValue({
      name: staff.name,
      email: staff.account.username,
      role: normalizeRole(staff.role),
      org_node_id: staff.org_node_id ?? undefined,
      visibility_org_node_ids: visibility,
      password: "******",
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingStaff(null);
    form.resetFields();
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

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();

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

        setIsModalVisible(false);
        form.resetFields();
        setIsSuccessModalVisible(true);

        fetchStaffs();
      } else if (code === 10002) {
        message.error(t("staffExists"));
      } else {
        message.error(t("createFailed"));
      }
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

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
        message.success(t("updateSuccess"));
        setIsModalVisible(false);
        setIsEditMode(false);
        setEditingStaff(null);
        form.resetFields();

        fetchStaffs();
      } else {
        message.error(t("updateFailed"));
      }
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    setCreatedStaffInfo(undefined);
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
      fetchStaffs();
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

  const columns = [
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
      dataIndex: ["account", "username"],
      key: "email",
      width: 200,
    },
    {
      title: t("role"),
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (r: string) => renderRoleLabel(r),
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => renderStatusTag(status),
    },
    {
      title: t("action"),
      key: "action",
      width: 220,
      render: (_: unknown, record: IStaffWithAccount) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => showEditModal(record)}
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
  ];

  return (
    <div className={styles.staffsPage}>
      <div className={styles.headerSection}>
        <div className={styles.pageTitle}>{t("title")}</div>
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
            onClick={showCreateModal}
          >
            {t("createStaff")}
          </Button>
        </div>
      </div>

      <div className={styles.tableSection}>
        <Table
          columns={columns}
          dataSource={visibleStaffs.slice(
            (page - 1) * PAGE_SIZE,
            page * PAGE_SIZE,
          )}
          loading={loading}
          rowKey="id"
          pagination={{
            showQuickJumper: true,
            showTotal: (total, range) =>
              originalT("pagination_total", {
                rangeStart: String(range[0]),
                rangeEnd: String(range[1]),
                total: String(total),
              }),
            pageSize: PAGE_SIZE,
            onChange: (p) => {
              setPage(p);
            },
          }}
        />
      </div>

      <Modal
        title={isEditMode ? t("editStaff") : t("createStaff")}
        open={isModalVisible}
        onOk={isEditMode ? handleUpdate : handleCreate}
        onCancel={handleCancel}
        okText={isEditMode ? t("update") : t("confirm")}
        cancelText={t("cancel")}
        width={560}
      >
        <Form form={form} layout="vertical" initialValues={{ role: "recruiter" }}>
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

          <Form.Item label={t("orgNode")} name="org_node_id">
            <OrgNodeTreeSelect
              style={{ width: "100%" }}
              placeholder={t("orgNodePlaceholder")}
              allowClear
            />
          </Form.Item>

          {role === "recruiter" && (
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
        onCancel={handleSuccessModalClose}
        footer={[
          <Button key="copy" type="primary" onClick={copyToClipboard}>
            {t("copyLoginInfo")}
          </Button>,
          <Button
            key="done"
            type="primary"
            onClick={handleSuccessModalClose}
          >
            {t("confirm")}
          </Button>,
        ]}
        width={400}
        closable={false}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <CheckCircleOutlined
            style={{
              fontSize: "24px",
              color: "#52c41a",
              marginTop: "2px",
            }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 16px 0", fontSize: "16px" }}>
              {t("successMessage")}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Staffs;
