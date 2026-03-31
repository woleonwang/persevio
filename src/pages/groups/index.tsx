import React, { useEffect, useMemo, useState } from "react";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tooltip,
  message,
} from "antd";
import { useTranslation } from "react-i18next";
import { Delete, Get, Post } from "@/utils/request";
import useStaffs from "@/hooks/useStaffs";
import styles from "./style.module.less";

const PAGE_SIZE = 10;

const Groups: React.FC = () => {
  const { staffs } = useStaffs();
  const [groups, setGroups] = useState<IGroupWithStaffIds[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IGroupWithStaffIds | null>(
    null,
  );
  const [page, setPage] = useState(1);
  const [form] = Form.useForm();

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`groups.${key}`, params);

  const fetchGroups = async () => {
    setLoading(true);
    const { code, data } = await Get<{ groups: IGroupWithStaffIds[] }>(
      "/api/groups",
    );
    if (code === 0) {
      setGroups(data.groups ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const visibleGroups = useMemo(() => {
    return groups.filter((group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [groups, searchTerm]);

  const staffOptions = useMemo(
    () =>
      staffs.map((staff) => ({
        label: staff.name,
        value: staff.id,
      })),
    [staffs],
  );

  const staffNameMap = useMemo(() => {
    return new Map(staffs.map((staff) => [staff.id, staff.name]));
  }, [staffs]);

  const showCreateModal = () => {
    setIsEditMode(false);
    setEditingGroup(null);
    form.resetFields();
    form.setFieldsValue({ staff_ids: [] });
    setIsModalOpen(true);
  };

  const showEditModal = (group: IGroupWithStaffIds) => {
    setIsEditMode(true);
    setEditingGroup(group);
    form.setFieldsValue({
      name: group.name,
      staff_ids: group.staff_ids ?? [],
    });
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingGroup(null);
    form.resetFields();
  };

  const handleCreate = async () => {
    const values = await form.validateFields();
    const payload = {
      name: String(values.name).trim(),
      staff_ids: values.staff_ids ?? [],
    };
    const response = await Post("/api/groups", payload);
    const errorMessage = (response as { message?: string }).message;
    const { code } = response;
    if (code === 0) {
      message.success(t("createSuccess"));
      handleCancel();
      fetchGroups();
      return;
    }
    message.error(errorMessage || t("createFailed"));
  };

  const handleUpdate = async () => {
    if (!editingGroup) return;
    const values = await form.validateFields();
    const payload = {
      name: String(values.name).trim(),
      staff_ids: values.staff_ids ?? [],
    };
    const response = await Post(`/api/groups/${editingGroup.id}`, payload);
    const errorMessage = (response as { message?: string }).message;
    const { code } = response;
    if (code === 0) {
      message.success(t("updateSuccess"));
      handleCancel();
      fetchGroups();
      return;
    }
    message.error(errorMessage || t("updateFailed"));
  };

  const handleDelete = (group: IGroupWithStaffIds) => {
    Modal.confirm({
      title: t("deleteTitle"),
      content: t("deleteConfirm", { name: group.name }),
      onOk: async () => {
        const { code, message: errorMessage } = await Delete(
          `/api/groups/${group.id}`,
        );
        if (code === 0) {
          message.success(t("deleteSuccess"));
          fetchGroups();
          return;
        }
        message.error(errorMessage || t("deleteFailed"));
      },
    });
  };

  const columns = [
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("staffCount"),
      key: "staffCount",
      render: (_: unknown, record: IGroupWithStaffIds) => {
        const names = record.staff_ids
          .map((staffId) => staffNameMap.get(staffId))
          .filter((name): name is string => Boolean(name));
        const tooltipText =
          names.length > 0 ? names.join(", ") : originalT("empty_text");
        return <Tooltip title={tooltipText}>{record.staff_ids.length}</Tooltip>;
      },
    },
    {
      title: t("action"),
      key: "action",
      render: (_: unknown, record: IGroupWithStaffIds) => {
        const hasStaff = record.staff_ids.length > 0;
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={() => showEditModal(record)}
            >
              {t("edit")}
            </Button>
            <Button
              type="link"
              size="small"
              danger
              disabled={hasStaff}
              title={hasStaff ? t("deleteDisabledHint") : ""}
              onClick={() => handleDelete(record)}
            >
              {t("delete")}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className={styles.groupsPage}>
      <div className={styles.headerSection}>
        <div className={styles.pageTitle}>{t("title")}</div>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.searchSection}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.actionSection}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showCreateModal}
          >
            {t("createGroup")}
          </Button>
        </div>
      </div>

      <div className={styles.tableSection}>
        <Table
          rowKey="id"
          columns={columns}
          loading={loading}
          dataSource={visibleGroups.slice(
            (page - 1) * PAGE_SIZE,
            page * PAGE_SIZE,
          )}
          pagination={{
            total: visibleGroups.length,
            pageSize: PAGE_SIZE,
            showQuickJumper: true,
            showTotal: (total, range) =>
              originalT("pagination_total", {
                rangeStart: String(range[0]),
                rangeEnd: String(range[1]),
                total: String(total),
              }),
            onChange: setPage,
          }}
        />
      </div>

      <Modal
        title={isEditMode ? t("editGroup") : t("createGroup")}
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={isEditMode ? handleUpdate : handleCreate}
        okText={isEditMode ? t("update") : t("confirm")}
        cancelText={t("cancel")}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t("name")}
            name="name"
            rules={[{ required: true, message: t("nameRequired") }]}
          >
            <Input placeholder={t("namePlaceholder")} />
          </Form.Item>
          <Form.Item label={t("staffIds")} name="staff_ids">
            <Select
              mode="multiple"
              allowClear
              showSearch
              options={staffOptions}
              placeholder={t("staffPlaceholder")}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Groups;
