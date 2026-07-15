import { Form, Input, InputNumber, Modal, Select } from "antd";

import { FaPlus, FaBook } from "react-icons/fa";
import { CreateCourseModalState } from "../hooks/useCreateCourseModal";

type CreateCourseModalProps = {
  state: CreateCourseModalState;
  setState: React.Dispatch<React.SetStateAction<CreateCourseModalState>>;
  onClose: () => void;
  onCreate: () => void;
  faculties?: { id: string; name: string }[];
  periods?: { id: string; name: string }[];
};

export function CreateCourseModal({
  onCreate,
  onClose,
  state,
  setState,
  faculties = [],
  periods = [],
}: CreateCourseModalProps) {
  return (
    <Modal
      title="Crear Curso"
      open={state.isOpen}
      onCancel={onClose}
      cancelText="Cancelar"
      onOk={onCreate}
      okButtonProps={{
        loading: state.loading,
        icon: <FaPlus />,
        disabled: state.loading,
      }}
      okText="Crear Curso"
    >
      <Form layout="vertical">
        <Form.Item label="Nombre" required>
          <Input
            placeholder="Ingrese el nombre del curso"
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
            placeholder="Ej: MAT101"
            maxLength={20}
            showCount
            value={state.code}
            onChange={(e) =>
              setState((prev) => ({ ...prev, code: e.target.value }))
            }
          />
        </Form.Item>

        <Form.Item label="Créditos" required>
          <InputNumber
            className="w-full"
            min={1}
            max={30}
            value={state.credits}
            onChange={(value) =>
              setState((prev) => ({
                ...prev,
                credits: typeof value === "number" ? value : 3,
              }))
            }
          />
        </Form.Item>

        <Form.Item label="Facultad" required>
          <Select
            className="w-full"
            placeholder="Seleccione una facultad"
            value={state.facultyId || undefined}
            onChange={(value) =>
              setState((prev) => ({ ...prev, facultyId: value }))
            }
            options={faculties.map((f) => ({
              value: f.id,
              label: f.name,
            }))}
          />
        </Form.Item>

        <Form.Item label="Período" required>
          <Select
            className="w-full"
            placeholder="Seleccione un período"
            value={state.periodId || undefined}
            onChange={(value) =>
              setState((prev) => ({ ...prev, periodId: value }))
            }
            options={periods.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
          />
        </Form.Item>

        <Form.Item label="Horario">
          <Input
            placeholder="Ej: Lunes y Miércoles 10:00-12:00"
            maxLength={100}
            value={state.schedule}
            onChange={(e) =>
              setState((prev) => ({ ...prev, schedule: e.target.value }))
            }
          />
        </Form.Item>

        <Form.Item label="Aula">
          <Input
            placeholder="Ej: A-101"
            maxLength={50}
            value={state.classroom}
            onChange={(e) =>
              setState((prev) => ({ ...prev, classroom: e.target.value }))
            }
          />
        </Form.Item>

        <Form.Item label="Capacidad Máxima">
          <InputNumber
            className="w-full"
            min={1}
            max={200}
            value={state.maxCapacity}
            onChange={(value) =>
              setState((prev) => ({
                ...prev,
                maxCapacity: typeof value === "number" ? value : 30,
              }))
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
