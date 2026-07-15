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
      title="Editar Facultad"
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
            placeholder="Ingrese el nombre de la facultad"
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
            placeholder="Ingrese el código de la facultad"
            disabled={state.loading}
            maxLength={10}
            showCount
            onChange={(event) =>
              setState((prev) => ({ ...prev, code: event.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium">Decano</label>
          <Input
            value={state.dean}
            placeholder="Ingrese el nombre del decano"
            disabled={state.loading}
            maxLength={150}
            showCount
            onChange={(event) =>
              setState((prev) => ({ ...prev, dean: event.target.value }))
            }
          />
        </div>
      </div>
    </Drawer>
  );
}
