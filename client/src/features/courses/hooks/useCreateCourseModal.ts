import { App } from "antd";
import { useState, useCallback } from "react";

import CoursesFeature, { CoursesAPITypes } from "..";

export type CreateCourseModalState = CoursesAPITypes.CreateCourseRequestBody & {
  isOpen: boolean;
  loading: boolean;
};

export function useCreateCourseModal({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { message } = App.useApp();

  const defaultState: CreateCourseModalState = {
    isOpen: false,
    loading: false,
    facultyId: "",
    periodId: "",
    code: "",
    name: "",
    credits: 3,
    schedule: "",
    classroom: "",
    maxCapacity: 30,
  };

  const [state, setState] = useState<CreateCourseModalState>(defaultState);

  const createCourse = useCallback(async () => {
    if (state.loading) return;

    const parsedData =
      CoursesFeature.schemas.createCourseSchema.safeParse(state);
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
    const result = await CoursesFeature.api.create(parsedData.data);
    if (result.status === "success" && result.course !== undefined) {
      message.success("Curso creado exitosamente");
      setState(defaultState);

      if (onSuccess) onSuccess();
      return;
    } else if (
      result.status === "faculty-not-found" ||
      result.status === "period-not-found" ||
      result.status === "course-code-exists"
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
    createCourse,
    openModal,
    closeModal,
  };
}
