import { useCallback, useState } from "react";
import { App } from "antd";

import FacultiesFeature from "..";
import { FacultiesAPITypes } from "..";

export interface UpdateDrawerState extends FacultiesAPITypes.UpdateFacultyRequestBody {
  loading: boolean;
  isOpen: boolean;
  name: string;
  code: string;
  dean: string;
}

export function useUpdateDrawer({ onSuccess }: { onSuccess: () => void }) {
  const { message } = App.useApp();

  const defaultState: UpdateDrawerState = {
    loading: false,
    isOpen: false,
    facultyId: "",
    name: "",
    code: "",
    dean: "",
  };

  const [state, setState] = useState<UpdateDrawerState>(defaultState);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const openDrawer = useCallback(
    async (facultyId: string) => {
      setState((prev) => ({ ...prev, loading: true }));

      const result = await FacultiesFeature.api.get({
        facultyIds: [facultyId],
        fields: [
          "id",
          "name",
          "code",
          "dean",
          "campusId",
        ],
      });

      if (
        result.status === "success" &&
        result.faculties &&
        result.faculties.length > 0
      ) {
        const faculty = result.faculties[0];

        const values: UpdateDrawerState = {
          loading: false,
          isOpen: true,
          facultyId: faculty.id,
          name: faculty.name ?? "",
          code: faculty.code ?? "",
          dean: faculty.dean ?? "",
        };

        setState(values);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
        message.error("Error al obtener la facultad");
      }
    },
    [message],
  );

  const update = useCallback(async () => {
    if (state.loading) return;

    const values: FacultiesAPITypes.UpdateFacultyRequestBody = {
      facultyId: state.facultyId,
      name: state.name || undefined,
      code: state.code || undefined,
      dean: state.dean,
    };

    const result = FacultiesFeature.schemas.updateFacultySchema.safeParse(values);

    if (!result.success || !result.data) {
      for (const issue of result.error.issues) {
        message.warning(issue.message);
      }
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const response = await FacultiesFeature.api.update(result.data);

    if (response.status === "success") {
      message.success("Facultad actualizada exitosamente");
      reset();

      if (onSuccess) {
        onSuccess();
      }
      return;
    }

    if (
      response.status === "faculty-not-found" ||
      response.status === "name-in-use" ||
      response.status === "code-in-use"
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
