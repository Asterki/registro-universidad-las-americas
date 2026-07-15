import { Form, Input, Modal, DatePicker, Switch } from "antd";

import { FaPlus, FaCalendarAlt } from "react-icons/fa";
import { CreatePeriodModalState } from "../hooks/useCreatePeriodModal";

type CreatePeriodModalProps = {
  state: CreatePeriodModalState;
  setState: React.Dispatch<React.SetStateAction<CreatePeriodModalState>>;
  onClose: () => void;
  onCreate: () => void;
};

export function CreatePeriodModal({
  onCreate,
  onClose,
  state,
  setState,
}: CreatePeriodModalProps) {
  return (
    <Modal
      title="Crear Período Académico"
      open={state.isOpen}
      onCancel={onClose}
      cancelText="Cancelar"
      onOk={onCreate}
      okButtonProps={{
        loading: state.loading,
        icon: <FaPlus />,
        disabled: state.loading,
      }}
      okText="Crear Período"
    >
      <Form layout="vertical">
        <Form.Item label="Nombre" required>
          <Input
            placeholder="Ej: 2026-1"
            maxLength={50}
            showCount
            value={state.name}
            onChange={(e) =>
              setState((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </Form.Item>

        <Form.Item label="Fecha de Inicio" required>
          <DatePicker
            className="w-full"
            value={state.startDate}
            onChange={(date) =>
              setState((prev) => ({ ...prev, startDate: date }))
            }
          />
        </Form.Item>

        <Form.Item label="Fecha de Fin" required>
          <DatePicker
            className="w-full"
            value={state.endDate}
            onChange={(date) =>
              setState((prev) => ({ ...prev, endDate: date }))
            }
          />
        </Form.Item>

        <Form.Item label="Activo">
          <Switch
            checked={state.active}
            onChange={(checked) =>
              setState((prev) => ({ ...prev, active: checked }))
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
