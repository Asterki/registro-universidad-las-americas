import { App } from "antd";
import { useState, useCallback } from "react";

import FacultiesFeature, { FacultiesAPITypes } from "..";

export type CreateFacultyModalState = FacultiesAPITypes.CreateFacultyRequestBody & {
  isOpen: boolean;
  loading: boolean;
};

export function useCreateModal({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { message } = App.useApp();

  const defaultState: CreateFacultyModalState = {
    isOpen: false,
    loading: false,
    campusId: "",
    name: "",
    code: "",
    dean: "",
  };

  const [state, setState] = useState<CreateFacultyModalState>(defaultState);

  const createFaculty = useCallback(async () => {
    if (state.loading) return;

    const parsedData =
      FacultiesFeature.schemas.createFacultySchema.safeParse(state);
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
    const result = await FacultiesFeature.api.create(parsedData.data);
    if (result.status === "success" && result.faculty !== undefined) {
      message.success("Facultad creada exitosamente");
      setState(defaultState);

      if (onSuccess) onSuccess();
      return;
    } else if (
      result.status === "name-in-use" ||
      result.status === "code-in-use" ||
      result.status === "campus-not-found"
    ) {
      message.warning(`Error: ${result.status}`);
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
    createFaculty,
    openModal,
    closeModal,
  };
}
