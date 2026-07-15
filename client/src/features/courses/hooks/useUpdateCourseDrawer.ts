import { useCallback, useState } from "react";
import { App } from "antd";

import CoursesFeature from "..";
import { CoursesAPITypes } from "..";

export interface UpdateCourseDrawerState {
  loading: boolean;
  isOpen: boolean;
  courseId: string;
  name: string;
  code: string;
  credits: number;
  schedule: string;
  classroom: string;
  maxCapacity: number;
  facultyId: string;
  periodId: string;
}

export function useUpdateCourseDrawer({ onSuccess }: { onSuccess: () => void }) {
  const { message } = App.useApp();

  const defaultState: UpdateCourseDrawerState = {
    loading: false,
    isOpen: false,
    courseId: "",
    name: "",
    code: "",
    credits: 3,
    schedule: "",
    classroom: "",
    maxCapacity: 30,
    facultyId: "",
    periodId: "",
  };

  const [state, setState] = useState<UpdateCourseDrawerState>(defaultState);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const openDrawer = useCallback(
    async (courseId: string) => {
      setState((prev) => ({ ...prev, loading: true }));

      const result = await CoursesFeature.api.get({
        courseIds: [courseId],
        fields: [
          "id",
          "name",
          "code",
          "credits",
          "schedule",
          "classroom",
          "maxCapacity",
          "facultyId",
          "periodId",
        ],
      });

      if (
        result.status === "success" &&
        result.courses &&
        result.courses.length > 0
      ) {
        const course = result.courses[0];

        const values: UpdateCourseDrawerState = {
          loading: false,
          isOpen: true,
          courseId: course.id,
          name: course.name ?? "",
          code: course.code ?? "",
          credits: course.credits ?? 3,
          schedule: course.schedule ?? "",
          classroom: course.classroom ?? "",
          maxCapacity: course.maxCapacity ?? 30,
          facultyId: course.facultyId ?? "",
          periodId: course.periodId ?? "",
        };

        setState(values);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
        message.error("Error al obtener el curso");
      }
    },
    [message],
  );

  const update = useCallback(async () => {
    if (state.loading) return;

    const values: CoursesAPITypes.UpdateCourseRequestBody = {
      courseId: state.courseId,
      name: state.name || undefined,
      code: state.code || undefined,
      credits: state.credits,
      schedule: state.schedule || undefined,
      classroom: state.classroom || undefined,
      maxCapacity: state.maxCapacity,
      facultyId: state.facultyId || undefined,
      periodId: state.periodId || undefined,
    };

    const result = CoursesFeature.schemas.updateCourseSchema.safeParse(values);

    if (!result.success || !result.data) {
      for (const issue of result.error.issues) {
        message.warning(issue.message);
      }
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const response = await CoursesFeature.api.update(result.data);

    if (response.status === "success") {
      message.success("Curso actualizado exitosamente");
      reset();

      if (onSuccess) {
        onSuccess();
      }
      return;
    }

    if (
      response.status === "course-not-found" ||
      response.status === "faculty-not-found" ||
      response.status === "period-not-found" ||
      response.status === "course-code-exists"
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
