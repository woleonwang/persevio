import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import { Get, Post } from "@/utils/request";
import styles from "./style.module.less";
import { copy } from "@/utils";

const { Option } = Select;

const PAGE_SIZE = 10;

const Staffs: React.FC = () => {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState<IStaffWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStaff, setEditingStaff] = useState<IStaffWithAccount | null>(
    null
  );
  const [form] = Form.useForm();
  const [page, setPage] = useState(1);
  const [createdStaffInfo, setCreatedStaffInfo] = useState<{
    name: string;
    email: string;
    password: string;
  }>();

  // 获取员工数据
  const fetchStaffs = async () => {
    setLoading(true);
    const { code, data } = await Get<{ staffs: IStaffWithAccount[] }>(
      "/api/staffs"
    );
    if (code === 0) {
      setStaffs(data.staffs);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchStaffs();
  }, []);

  // 过滤员工数据
  const visibleStaffs = staffs.filter(
    (staff) =>
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.account.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 生成随机密码
  const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let password = "";

    // 确保每种字符至少有一个
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // 填充剩余长度到8位
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // 打乱密码字符顺序
    password = password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");

    form.setFieldsValue({ password: password });
  };

  // 显示创建 Modal
  const showCreateModal = () => {
    setIsEditMode(false);
    setEditingStaff(null);
    setIsModalVisible(true);
    form.resetFields();
    generatePassword();
    form.setFieldsValue({ role: "normal" });
  };

  // 显示编辑 Modal
  const showEditModal = (staff: IStaffWithAccount) => {
    setIsEditMode(true);
    setEditingStaff(staff);
    setIsModalVisible(true);
    form.setFieldsValue({
      name: staff.name,
      email: staff.account.username,
      role: staff.role,
      password: "******", // 编辑模式下不显示真实密码
    });
  };

  // 隐藏 Modal
  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditMode(false);
    setEditingStaff(null);
    form.resetFields();
  };

  // 复制信息到剪贴板
  const copyToClipboard = async () => {
    if (!createdStaffInfo) return;

    const loginUrl = `${window.location.origin}/signin`;
    const copyText = `登录链接: ${loginUrl}\n账号名称: ${createdStaffInfo.name}\n账号邮箱: ${createdStaffInfo.email}\n默认密码: ${createdStaffInfo.password}`;

    await copy(copyText);
    message.success("账号信息已复制到剪贴板");
  };

  // 创建员工
  const handleCreate = async () => {
    try {
      const values = await form.validateFields();

      const createData = {
        username: values.email,
        password: values.password,
        name: values.name,
        role: values.role,
      };

      const { code } = await Post("/api/staffs", createData);

      if (code === 0) {
        // 保存创建的员工信息
        setCreatedStaffInfo({
          name: values.name,
          email: values.email,
          password: values.password,
        });

        // 关闭创建 Modal，显示成功 Modal
        setIsModalVisible(false);
        form.resetFields();
        setIsSuccessModalVisible(true);

        // 刷新员工列表
        fetchStaffs();
      } else if (code === 10002) {
        message.error("员工已存在");
      } else {
        message.error("员工创建失败");
      }
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  // 更新员工
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

      if (!editingStaff) return;

      const updateData = {
        name: values.name,
        role: values.role,
      };

      const { code } = await Post(`/api/staffs/${editingStaff.id}`, updateData);

      if (code === 0) {
        message.success("员工信息更新成功");
        setIsModalVisible(false);
        setIsEditMode(false);
        setEditingStaff(null);
        form.resetFields();

        // 刷新员工列表
        fetchStaffs();
      } else {
        message.error("员工信息更新失败");
      }
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  // 关闭成功 Modal
  const handleSuccessModalClose = () => {
    setIsSuccessModalVisible(false);
    setCreatedStaffInfo(undefined);
  };

  // 表格列定义
  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
    },
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      width: 120,
    },
    {
      title: "邮箱",
      dataIndex: ["account", "username"],
      key: "email",
      width: 200,
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role: string) => {
        return role === "admin" ? "管理员" : "员工";
      },
    },
    {
      title: "操作",
      key: "action",
      width: 120,
      render: (_: any, record: IStaffWithAccount) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            onClick={() => showEditModal(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.staffsPage}>
      {/* 头部区域 */}
      <div className={styles.headerSection}>
        <div className={styles.titleSection}>
          <ArrowLeftOutlined
            className={styles.backArrow}
            onClick={handleBack}
          />
          <h1 className={styles.pageTitle}>员工列表</h1>
        </div>
      </div>

      {/* 筛选和操作区域 */}
      <div className={styles.filterSection}>
        <div className={styles.searchSection}>
          <Input
            placeholder="员工姓名、账号邮箱"
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
            创建员工
          </Button>
        </div>
      </div>

      {/* 表格区域 */}
      <div className={styles.tableSection}>
        <Table
          columns={columns}
          dataSource={visibleStaffs.slice(
            (page - 1) * PAGE_SIZE,
            page * PAGE_SIZE
          )}
          loading={loading}
          rowKey="id"
          pagination={{
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            pageSize: PAGE_SIZE,
            onChange: (page) => {
              setPage(page);
            },
          }}
        />
      </div>

      {/* 创建/编辑员工 Modal */}
      <Modal
        title={isEditMode ? "编辑员工" : "创建员工"}
        open={isModalVisible}
        onOk={isEditMode ? handleUpdate : handleCreate}
        onCancel={handleCancel}
        okText={isEditMode ? "更新" : "确认"}
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical" initialValues={{ role: "normal" }}>
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input placeholder="请输入员工姓名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: "请输入邮箱" },
              { type: "email", message: "请输入有效的邮箱格式" },
            ]}
          >
            <Input placeholder="请输入员工邮箱" disabled={isEditMode} />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: "请选择角色" }]}
          >
            <Select placeholder="请选择角色">
              <Option value="normal">员工</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>

          {!isEditMode && (
            <Form.Item
              label="默认密码"
              name="password"
              rules={[{ required: true, message: "密码不能为空" }]}
            >
              <Input readOnly />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 创建成功 Modal */}
      <Modal
        title=""
        open={isSuccessModalVisible}
        onCancel={handleSuccessModalClose}
        footer={[
          <Button key="confirm" type="primary" onClick={copyToClipboard}>
            复制登录信息
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handleSuccessModalClose}
          >
            确定
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
              账号创建成功。可复制登录信息，发送给用户登录。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Staffs;
