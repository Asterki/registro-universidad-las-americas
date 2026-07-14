import { useState, useCallback } from "react";

import { requestsApi } from "../api";
import { App } from "antd";

export function useMyRequests() {
  const { message } = App.useApp();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(
    async (data?: { status?: "pending" | "approved" | "rejected" | "in_review" }) => {
      setLoading(true);

      const result = await requestsApi.listMy(data || {});

      if (result.status === "success") {
        setRequests(result.requests || []);
        setLoading(false);
      } else {
        message.error("Error al cargar las solicitudes.");
        setLoading(false);
      }
    },
    [message],
  );

  return {
    requests,
    loading,
    fetchRequests,
  };
}
