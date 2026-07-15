import { Form, Input, Modal, DatePicker } from "antd";

import { FaPlus, FaBuilding } from "react-icons/fa";
import dayjs from "dayjs";
import { CreateCampusModalState } from "../hooks/useCreateModal";

type CreateCampusModalProps = {
  state: CreateCampusModalState;
  setState: React.Dispatch<React.SetStateAction<CreateCampusModalState>>;
  onClose: () => void;
  onCreate: () => void;
};

export function CreateModal({
  onCreate,
  onClose,
  state,
  setState,
}: CreateCampusModalProps) {
  return (
    <Modal
      title="Crear Campus"
      open={state.isOpen}
      onCancel={onClose}
      cancelText="Cancelar"
      onOk={onCreate}
      okButtonProps={{
        loading: state.loading,
        icon: <FaPlus />,
        disabled: state.loading,
      }}
      okText="Crear Campus"
    >
      <Form layout="vertical">
        <Form.Item label="Nombre" required>
          <Input
            placeholder="Ingrese el nombre del campus"
            maxLength={100}
            showCount
            value={state.name}
            onChange={(e) =>
              setState((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </Form.Item>

        <Form.Item label="Ciudad" required>
          <Input
            placeholder="Ingrese la ciudad"
            maxLength={100}
            showCount
            value={state.city}
            onChange={(e) =>
              setState((prev) => ({ ...prev, city: e.target.value }))
            }
          />
        </Form.Item>

        <Form.Item label="Dirección" required>
          <Input
            placeholder="Ingrese la dirección"
            maxLength={200}
            showCount
            value={state.address}
            onChange={(e) =>
              setState((prev) => ({ ...prev, address: e.target.value }))
            }
          />
        </Form.Item>

        <Form.Item label="Teléfono" required>
          <Input
            placeholder="Ingrese el teléfono"
            maxLength={20}
            showCount
            value={state.phone}
            onChange={(e) =>
              setState((prev) => ({ ...prev, phone: e.target.value }))
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
