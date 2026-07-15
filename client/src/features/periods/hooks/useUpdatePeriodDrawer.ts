import { useCallback, useState } from "react";
import { App } from "antd";
import dayjs from "dayjs";

import PeriodsFeature from "..";
import { PeriodsAPITypes } from "..";

export interface UpdatePeriodDrawerState {
  loading: boolean;
  isOpen: boolean;
  periodId: string;
  name: string;
  startDate: any;
  endDate: any;
  active: boolean;
}

export function useUpdatePeriodDrawer({ onSuccess }: { onSuccess: () => void }) {
  const { message } = App.useApp();

  const defaultState: UpdatePeriodDrawerState = {
    loading: false,
    isOpen: false,
    periodId: "",
    name: "",
    startDate: null,
    endDate: null,
    active: true,
  };

  const [state, setState] = useState<UpdatePeriodDrawerState>(defaultState);

  const reset = useCallback(() => {
    setState(defaultState);
  }, []);

  const openDrawer = useCallback(
    async (periodId: string) => {
      setState((prev) => ({ ...prev, loading: true }));

      const result = await PeriodsFeature.api.get({
        periodIds: [periodId],
        fields: [
          "id",
          "name",
          "startDate",
          "endDate",
          "active",
        ],
      });

      if (
        result.status === "success" &&
        result.periods &&
        result.periods.length > 0
      ) {
        const period = result.periods[0];

        const values: UpdatePeriodDrawerState = {
          loading: false,
          isOpen: true,
          periodId: period.id,
          name: period.name ?? "",
          startDate: period.startDate ? dayjs(period.startDate) : null,
          endDate: period.endDate ? dayjs(period.endDate) : null,
          active: period.active ?? false,
        };

        setState(values);
      } else {
        setState((prev) => ({ ...prev, loading: false }));
        message.error("Error al obtener el período");
      }
    },
    [message],
  );

  const update = useCallback(async () => {
    if (state.loading) return;

    const values: PeriodsAPITypes.UpdatePeriodRequestBody = {
      periodId: state.periodId,
      name: state.name || undefined,
      startDate: state.startDate ? dayjs(state.startDate).toDate() : undefined,
      endDate: state.endDate ? dayjs(state.endDate).toDate() : undefined,
      active: state.active,
    };

    const result = PeriodsFeature.schemas.updatePeriodSchema.safeParse(values);

    if (!result.success || !result.data) {
      for (const issue of result.error.issues) {
        message.warning(issue.message);
      }
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    const response = await PeriodsFeature.api.update(result.data);

    if (response.status === "success") {
      message.success("Período actualizado exitosamente");
      reset();

      if (onSuccess) {
        onSuccess();
      }
      return;
    }

    if (
      response.status === "period-not-found" ||
      response.status === "period-end-before-start" ||
      response.status === "period-name-in-use"
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
