import { App } from "antd";
import { useState, useCallback } from "react";
import dayjs from "dayjs";

import PeriodsFeature, { PeriodsAPITypes } from "..";

export type CreatePeriodModalState = Omit<PeriodsAPITypes.CreatePeriodRequestBody, "startDate" | "endDate"> & {
  isOpen: boolean;
  loading: boolean;
  startDate: any;
  endDate: any;
};

export function useCreatePeriodModal({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const { message } = App.useApp();

  const defaultState: CreatePeriodModalState = {
    isOpen: false,
    loading: false,
    name: "",
    startDate: null,
    endDate: null,
    active: true,
  };

  const [state, setState] = useState<CreatePeriodModalState>(defaultState);

  const createPeriod = useCallback(async () => {
    if (state.loading) return;

    const data = {
      ...state,
      startDate: state.startDate ? dayjs(state.startDate).toDate() : new Date(),
      endDate: state.endDate ? dayjs(state.endDate).toDate() : new Date(),
    };

    const parsedData =
      PeriodsFeature.schemas.createPeriodSchema.safeParse(data);
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
    const result = await PeriodsFeature.api.create(parsedData.data);
    if (result.status === "success" && result.period !== undefined) {
      message.success("Período creado exitosamente");
      setState(defaultState);

      if (onSuccess) onSuccess();
      return;
    } else if (
      result.status === "period-end-before-start" ||
      result.status === "period-name-in-use"
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
    createPeriod,
    openModal,
    closeModal,
  };
}
