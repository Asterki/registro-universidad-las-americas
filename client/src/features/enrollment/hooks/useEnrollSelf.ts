import { useState, useCallback } from "react";

import { enrollmentApi } from "../api";
import { App } from "antd";

export function useEnrollSelf() {
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);

  const enroll = useCallback(
    async (data: { courseId: string }) => {
      setLoading(true);

      const result = await enrollmentApi.enrollSelf(data);

      if (result.status === "success") {
        setLoading(false);
        message.success("Matrícula realizada exitosamente.");
        return result.enrollment;
      } else {
        setLoading(false);
        if (result.status === "already-enrolled") {
          message.error("Ya estás matriculado en este curso.");
        } else if (result.status === "course-full") {
          message.error("El curso está lleno.");
        } else if (result.status === "prerequisites-not-met") {
          message.error("No cumples con los prerrequisitos necesarios.");
        } else if (result.status === "invalid-period") {
          message.error("El período seleccionado no es válido.");
        } else {
          message.error("Error al realizar la matrícula. Intenta de nuevo.");
        }
        return null;
      }
    },
    [message],
  );

  return {
    loading,
    enroll,
  };
}
