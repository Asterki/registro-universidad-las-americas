import { Form, Input, Modal, Select } from "antd";
import { useTranslation } from "react-i18next";
import { FaRecycle } from "react-icons/fa";

import type { UpdateDrawerState } from "../hooks/useUpdateModal";

type UpdateModalProps = {
  state: UpdateDrawerState;
  setState: React.Dispatch<React.SetStateAction<UpdateDrawerState>>;
  onClose: () => void;
  onUpdate: () => void;
  accountRoles?: { id: string; name: string; level: number }[];
  campuses?: { id: string; name: string }[];
  faculties?: { id: string; name: string }[];
};

export function UpdateModal({
  state,
  setState,
  onClose,
  onUpdate,
  accountRoles = [],
  campuses = [],
  faculties = [],
}: UpdateModalProps) {
  const { t } = useTranslation(["features"], {
    keyPrefix: "accounts.components.updateModal",
  });
  const { t: tCommon } = useTranslation(["common"]);

  return (
    <Modal
      title={t("title")}
      open={state.isOpen}
      onCancel={onClose}
      cancelText={tCommon("cancel")}
      onOk={onUpdate}
      okButtonProps={{
        loading: state.loading,
        icon: <FaRecycle />,
        disabled: state.loading,
      }}
      okText={t("title")}
    >
      <Form layout="vertical">
        <Form.Item label={t("fields.name")} required>
          <Input
            value={state.name}
            onChange={(e) =>
              setState((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={state.loading}
          />
        </Form.Item>
        <Form.Item label={t("fields.email")} required>
          <Input
            value={state.email}
            onChange={(e) =>
              setState((prev) => ({ ...prev, email: e.target.value }))
            }
            disabled={state.loading}
          />
        </Form.Item>
        <Form.Item label={t("fields.role")} required>
          <Select
            value={state.roleId}
            onChange={(val) => setState((prev) => ({ ...prev, roleId: val }))}
            defaultValue={state.roleId}
            disabled={state.loading}
            options={accountRoles.map((role) => ({
              label: `${role.name} (${role.level})`,
              value: role.id,
            }))}
          />
        </Form.Item>
        <Form.Item label={t("fields.campus")} required>
          <Select
            placeholder={t("fields.campusPlaceholder")}
            options={[
              ...(campuses?.map((campus) => ({
                label: campus.name,
                value: campus.id,
              })) || []),
            ]}
            value={state.campusId}
            onChange={(value) =>
              setState((prev) => ({ ...prev, campusId: value }))
            }
          />
        </Form.Item>

        <Form.Item label={"Facultad"}>
          <Select
            placeholder={"Seleccione una facultad"}
            options={[
              ...(faculties?.map((faculty) => ({
                label: faculty.name,
                value: faculty.id,
              })) || []),
            ]}
            value={state.facultyId}
            onChange={(value) =>
              setState((prev) => ({ ...prev, facultyId: value }))
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
