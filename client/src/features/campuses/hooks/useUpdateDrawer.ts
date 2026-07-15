import { useCallback, useState } from "react";
import { App } from "antd";
import dayjs from "dayjs";

import CampusesFeature from "..";
import { CampusesAPITypes } from "..";

export interface UpdateDrawerState {
  loading: boolean;
  isOpen: boolean;
  campusId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
}

export function useUpdateDrawer({ onSuccess }: { onSuccess: () => void }) {
  const { message } = App.useApp();

  const defaultState: UpdateDrawerState = {
    loading: false,
    isOpen: false,
    campusId: "",
    name: "",
    city: "",
    address: "",
    phone: "",
  };

  const [state, setState] = useState<UpdateDrawerState>(defaultState);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const openDrawer = useCallback(
    async (campusId: string) => {
      setState((prev) => ({ ...prev, loading: true }));

      const result = await CampusesFeature.api.get({
        campusIds: [campusId],
        fields: [
          "id",
          "name",
          "city",
          "address",
          "phone",
        ],
      });

      if (
        result.status === "success" &&
        result.campuses &&
        result.campuses.length > 0
      ) {
        const campus = result.campuses[0];

        const values: UpdateDrawerState = {
          loading: false,
          isOpen: true,
          campusId: campus.id,
          name: campus.name ?? "",
          city: campus.city ?? "",
          address: campus.address ?? "",
          phone: campus.phone ?? "",
        };

        setState(values);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
        message.error("Error al obtener el campus");
      }
    },
    [message],
  );

  const update = useCallback(async () => {
    if (state.loading) return;

    const values: CampusesAPITypes.UpdateRequestBody = {
      campusId: state.campusId,
      name: state.name || undefined,
      city: state.city || undefined,
      address: state.address || undefined,
      phone: state.phone || undefined,
    };

    const result = CampusesFeature.schemas.updateSchema.safeParse(values);

    if (!result.success || !result.data) {
      for (const issue of result.error.issues) {
        message.warning(issue.message);
      }
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const response = await CampusesFeature.api.update(result.data);

    if (response.status === "success") {
      message.success("Campus actualizado exitosamente");
      reset();

      if (onSuccess) {
        onSuccess();
      }
      return;
    }

    if (
      response.status === "campus-not-found" ||
      response.status === "name-in-use"
    ) {
      message.warning(`Error: ${response.status}`);
    } else {
      message.error(`Error: ${response.status}`);
    }

    setState((prev) => ({ ...prev, loading: false }));
  }, [message, onSuccess, reset, state]);

  return {
    state,
    setState,
    reset,
    update,
    openDrawer,
  };
}
