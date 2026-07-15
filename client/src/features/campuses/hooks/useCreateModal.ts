import { App } from "antd";
import { useState, useCallback } from "react";
import dayjs from "dayjs";

import CampusesFeature, { CampusesAPITypes } from "..";

export type CreateCampusModalState = {
  isOpen: boolean;
  loading: boolean;
  name: string;
  city: string;
  address: string;
  phone: string;
  createdAt: any;
};

export function useCreateModal({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { message } = App.useApp();

  const defaultState: CreateCampusModalState = {
    isOpen: false,
    loading: false,
    name: "",
    city: "",
    address: "",
    phone: "",
    createdAt: dayjs(),
  };

  const [state, setState] = useState<CreateCampusModalState>(defaultState);

  const createCampus = useCallback(async () => {
    if (state.loading) return;

    const data = {
      name: state.name,
      city: state.city,
      address: state.address,
      phone: state.phone,
      createdAt: state.createdAt ? dayjs(state.createdAt).toDate() : new Date(),
    };

    const parsedData =
      CampusesFeature.schemas.createSchema.safeParse(data);
    if (!parsedData.success) {
      for (const issue of parsedData.error.issues) {
        message.warning(issue.message);
      }
      return;
    }

    setState((prev) => ({
      ...prev,
      loading: true,
    }));
    const result = await CampusesFeature.api.create(parsedData.data);
    if (result.status === "success" && result.campus !== undefined) {
      message.success("Campus creado exitosamente");
      setState(defaultState);

      if (onSuccess) onSuccess();
      return;
    } else if (result.status === "name-in-use") {
      message.warning("El nombre ya está en uso");
    } else {
      message.error(`Error: ${result.status}`);
    }

    setState((prev) => ({
      ...prev,
      loading: false,
    }));
  }, [state, message]);

  const openModal = useCallback(
    () => setState((prev) => ({ ...prev, isOpen: true })),
    [],
  );
  const closeModal = useCallback(() => setState(defaultState), []);

  return {
    state,
    setState,
    createCampus,
    openModal,
    closeModal,
  };
}
