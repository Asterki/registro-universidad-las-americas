import { useState, useCallback } from "react";

import PeriodsFeature, { ListPeriod, PeriodsAPITypes } from "..";
import { App } from "antd";

type NullablePeriodsListState = {
  [K in keyof PeriodsAPITypes.ListAllPeriodsRequestBody]?:
    | PeriodsAPITypes.ListAllPeriodsRequestBody[K]
    | null;
};

type UsePeriodsListOptions = {
  apiList?: typeof PeriodsFeature.api.list;
};

export function usePeriodList({
  apiList = PeriodsFeature.api.list,
}: UsePeriodsListOptions) {
  const { message } = App.useApp();

  const [periodsListState, setPeriodsListState] = useState<
    PeriodsAPITypes.ListAllPeriodsRequestBody & { loading: boolean }
  >({
    loading: true,
    fields: [
      "metadata.createdAt",
      "metadata.deleted",
      "id",
      "name",
      "startDate",
      "endDate",
      "active",
    ],
    count: 50,
    page: 0,
  });

  const [periods, setPeriods] = useState<{
    totalPeriods: number;
    periods: ListPeriod[];
  }>({
    periods: [],
    totalPeriods: 0,
  });

  const fetchPeriods = useCallback(
    async ({
      count = periodsListState.count,
      page = periodsListState.page,
      includeDeleted = periodsListState.includeDeleted,
      active = periodsListState.active,
    }: NullablePeriodsListState = {}) => {
      setPeriodsListState((prev) => ({ ...prev, loading: true }));

      const result = await apiList({
        ...periodsListState,
        includeDeleted: includeDeleted == null ? undefined : includeDeleted,
        active: active == null ? undefined : active,
      });

      if (result.status === "success") {
        setPeriodsListState((prev) => {
          return {
            ...prev,
            count: count as number,
            page: page as number,
            includeDeleted: includeDeleted == null ? undefined : includeDeleted,
            active: active == null ? undefined : active,
            loading: false,
          };
        });

        setPeriods({
          periods: result.periods!.map((period: any) => ({
            id: period.id,
            name: period.name ?? "",
            startDate: period.startDate ?? "",
            endDate: period.endDate ?? "",
            active: period.active ?? false,
            deleted: period.metadata?.deleted ?? false,
          })),
          totalPeriods: result.totalPeriods ?? 0,
        });
      } else {
        if (message) {
          message.error(`Error: ${result.status}`);
        }
        setPeriodsListState((prev) => ({ ...prev, loading: false }));
      }
    },
    [periodsListState, message],
  );

  return {
    periodsListState,
    periods,
    fetchPeriods,
  };
}
