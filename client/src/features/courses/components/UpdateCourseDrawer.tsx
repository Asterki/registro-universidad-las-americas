import { Button, Drawer, Input, InputNumber, Select } from "antd";

import { FaSave } from "react-icons/fa";
import type { Dispatch, SetStateAction } from "react";

import type { UpdateCourseDrawerState } from "../hooks/useUpdateCourseDrawer";

type UpdateCourseDrawerProps = {
  state: UpdateCourseDrawerState;
  setState: Dispatch<SetStateAction<UpdateCourseDrawerState>>;
  onClose: () => void;
  onUpdate: () => void | Promise<void>;
  faculties?: { id: string; name: string }[];
  periods?: { id: string; name: string }[];
};

export function UpdateCourseDrawer({
  state,
  setState,
  onClose,
  onUpdate,
  faculties = [],
  periods = [],
}: UpdateCourseDrawerProps) {
  return (
    <Drawer
      width={600}
      title="Editar Curso"
      open={state.isOpen}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Button
          type="primary"
          variant="solid"
          onClick={onUpdate}
          loading={state.loading}
          icon={<FaSave />}
        >
          Guardar
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="font-medium">Nombre</label>
          <Input
            value={state.name}
            placeholder="Ingrese el nombre del curso"
            disabled={state.loading}
            maxLength={150}
            showCount
            onChange={(event) =>
              setState((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Código</label>
          <Input
            value={state.code}
            placeholder="Ej: MAT101"
            disabled={state.loading}
            maxLength={20}
            showCount
            onChange={(event) =>
              setState((prev) => ({ ...prev, code: event.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Créditos</label>
          <InputNumber
            className="w-full"
            min={1}
            max={30}
            value={state.credits}
            disabled={state.loading}
            onChange={(value) =>
              setState((prev) => ({
                ...prev,
                credits: typeof value === "number" ? value : 3,
              }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Facultad</label>
          <Select
            className="w-full"
            placeholder="Seleccione una facultad"
            value={state.facultyId || undefined}
            disabled={state.loading}
            onChange={(value) =>
              setState((prev) => ({ ...prev, facultyId: value }))
            }
            options={faculties.map((f) => ({
              value: f.id,
              label: f.name,
            }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Período</label>
          <Select
            className="w-full"
            placeholder="Seleccione un período"
            value={state.periodId || undefined}
            disabled={state.loading}
            onChange={(value) =>
              setState((prev) => ({ ...prev, periodId: value }))
            }
            options={periods.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Horario</label>
          <Input
            value={state.schedule}
            placeholder="Ej: Lunes y Miércoles 10:00-12:00"
            disabled={state.loading}
            maxLength={100}
            onChange={(event) =>
              setState((prev) => ({ ...prev, schedule: event.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Aula</label>
          <Input
            value={state.classroom}
            placeholder="Ej: A-101"
            disabled={state.loading}
            maxLength={50}
            onChange={(event) =>
              setState((prev) => ({ ...prev, classroom: event.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Capacidad Máxima</label>
          <InputNumber
            className="w-full"
            min={1}
            max={200}
            value={state.maxCapacity}
            disabled={state.loading}
            onChange={(value) =>
              setState((prev) => ({
                ...prev,
                maxCapacity: typeof value === "number" ? value : 30,
              }))
            }
          />
        </div>
      </div>
    </Drawer>
  );
}
