import { useState, useCallback } from "react";

import { requestsApi } from "../api";
import { App } from "antd";

export function useCreateRequest() {
  const { message } = App.useApp();

  const [loading, setLoading] = useState(false);

  const createRequest = useCallback(
    async (data: {
      type: string;
      description: string;
      facultyId: string;
    }) => {
      setLoading(true);

      const result = await requestsApi.create(data);

      if (result.status === "success") {
        setLoading(false);
        message.success("Solicitud creada exitosamente.");
        return result.request;
      } else {
        setLoading(false);
        message.error("Error al crear la solicitud. Intenta de nuevo.");
        return null;
      }
    },
    [message],
  );

  return {
    loading,
    createRequest,
  };
}
