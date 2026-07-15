import { Form, Input, Modal } from "antd";

import { FaPlus, FaUniversity } from "react-icons/fa";
import { CreateFacultyModalState } from "../hooks/useCreateModal";

type CreateFacultyModalProps = {
  state: CreateFacultyModalState;
  setState: React.Dispatch<React.SetStateAction<CreateFacultyModalState>>;
  onClose: () => void;
  onCreate: () => void;
};

export function CreateModal({
  onCreate,
  onClose,
  state,
  setState,
}: CreateFacultyModalProps) {
  return (
    <Modal
      title="Crear Facultad"
      open={state.isOpen}
      onCancel={onClose}
      cancelText="Cancelar"
      onOk={onCreate}
      okButtonProps={{
        loading: state.loading,
        icon: <FaPlus />,
        disabled: state.loading,
      }}
      okText="Crear Facultad"
    >
      <Form layout="vertical">
        <Form.Item label="Nombre" required>
          <Input
            placeholder="Ingrese el nombre de la facultad"
            maxLength={150}
            showCount
            value={state.name}
            onChange={(e) =>
              setState((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </Form.Item>

        <Form.Item label="Código" required>
          <Input
            placeholder="Ingrese el código de la facultad"
            maxLength={10}
            showCount
            value={state.code}
            onChange={(e) =>
              setState((prev) => ({ ...prev, code: e.target.value }))
            }
          />
        </Form.Item>

        <Form.Item label="Decano">
          <Input
            placeholder="Ingrese el nombre del decano"
            maxLength={150}
            showCount
            value={state.dean}
            onChange={(e) =>
              setState((prev) => ({ ...prev, dean: e.target.value }))
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
