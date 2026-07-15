import { Button, Drawer, Input, DatePicker, Switch } from "antd";

import { FaSave } from "react-icons/fa";
import type { Dispatch, SetStateAction } from "react";

import type { UpdatePeriodDrawerState } from "../hooks/useUpdatePeriodDrawer";

type UpdatePeriodDrawerProps = {
  state: UpdatePeriodDrawerState;
  setState: Dispatch<SetStateAction<UpdatePeriodDrawerState>>;
  onClose: () => void;
  onUpdate: () => void | Promise<void>;
};

export function UpdatePeriodDrawer({
  state,
  setState,
  onClose,
  onUpdate,
}: UpdatePeriodDrawerProps) {
  return (
    <Drawer
      width={600}
      title="Editar Período Académico"
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
            placeholder="Ej: 2026-1"
            disabled={state.loading}
            maxLength={50}
            showCount
            onChange={(event) =>
              setState((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Fecha de Inicio</label>
          <DatePicker
            className="w-full"
            value={state.startDate}
            disabled={state.loading}
            onChange={(date) =>
              setState((prev) => ({ ...prev, startDate: date }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Fecha de Fin</label>
          <DatePicker
            className="w-full"
            value={state.endDate}
            disabled={state.loading}
            onChange={(date) =>
              setState((prev) => ({ ...prev, endDate: date }))
            }
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={state.active}
            disabled={state.loading}
            onChange={(checked) =>
              setState((prev) => ({ ...prev, active: checked }))
            }
          />
          <span>Activo</span>
        </div>
      </div>
    </Drawer>
  );
}
