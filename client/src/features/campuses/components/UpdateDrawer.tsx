import { Button, Drawer, Input } from "antd";

import { FaSave } from "react-icons/fa";
import type { Dispatch, SetStateAction } from "react";

import type { UpdateDrawerState } from "../hooks/useUpdateDrawer";

type UpdateDrawerProps = {
  state: UpdateDrawerState;
  setState: Dispatch<SetStateAction<UpdateDrawerState>>;
  onClose: () => void;
  onUpdate: () => void | Promise<void>;
};

export function UpdateDrawer({
  state,
  setState,
  onClose,
  onUpdate,
}: UpdateDrawerProps) {
  return (
    <Drawer
      width={600}
      title="Editar Campus"
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
            placeholder="Ingrese el nombre del campus"
            disabled={state.loading}
            maxLength={100}
            showCount
            onChange={(event) =>
              setState((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Ciudad</label>
          <Input
            value={state.city}
            placeholder="Ingrese la ciudad"
            disabled={state.loading}
            maxLength={100}
            showCount
            onChange={(event) =>
              setState((prev) => ({ ...prev, city: event.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Dirección</label>
          <Input
            value={state.address}
            placeholder="Ingrese la dirección"
            disabled={state.loading}
            maxLength={200}
            showCount
            onChange={(event) =>
              setState((prev) => ({ ...prev, address: event.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Teléfono</label>
          <Input
            value={state.phone}
            placeholder="Ingrese el teléfono"
            disabled={state.loading}
            maxLength={20}
            showCount
            onChange={(event) =>
              setState((prev) => ({ ...prev, phone: event.target.value }))
            }
          />
        </div>
      </div>
    </Drawer>
  );
}
