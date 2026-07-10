import { useState, useCallback } from "react";

import CampusesFeature, { ListCampus, CampusesAPITypes } from "..";
import { useTranslation } from "react-i18next";
import { App } from "antd";

type NullableCampusesListState = {
  [K in keyof CampusesAPITypes.ListRequestBody]?:
  | CampusesAPITypes.ListRequestBody[K]
  | null;
};

type UseCampusesListOptions = {
  apiList?: typeof CampusesFeature.api.list;
};

export function useList({
  apiList = CampusesFeature.api.list,
}: UseCampusesListOptions) {
  const { message } = App.useApp();

  const { t } = useTranslation(["features"], {
    keyPrefix: "campuses.hooks.useList",
  });
  const { t: tErrorMessages } = useTranslation(["error-messages"]);

  const [campusesListState, setCampusesListState] = useState<
    CampusesAPITypes.ListRequestBody & { loading: boolean }
  >({
    loading: true,
    fields: [
      "metadata.createdAt",
      "metadata.deleted",
      "id",
      "name",
      "address",
      "city",
      "createdAt",
      "phone"
    ],
    count: 50,
    page: 0,
  });

  const [campuses, setCampuses] = useState<{
    totalCampuses: number;
    campuses: ListCampus[];
  }>({
    campuses: [],
    totalCampuses: 0,
  });

  const fetchCampuses = useCallback(
    async ({
      count = campusesListState.count,
      page = campusesListState.page,
      includeDeleted = campusesListState.includeDeleted,
      search = campusesListState.search,
    }: NullableCampusesListState = {}) => {
      setCampusesListState((prev) => ({ ...prev, loading: true }));

      const result = await apiList({
        ...campusesListState,
        search: search == null ? undefined : search,
        includeDeleted: includeDeleted == null ? undefined : includeDeleted,
      });

      if (result.status === "success") {
        setCampusesListState((prev) => {
          return {
            ...prev,
            count: count as number,
            page: page as number,
            search: search == null ? undefined : search,
            includeDeleted: includeDeleted == null ? undefined : includeDeleted,
            loading: false,
          };
        });

        setCampuses({
          campuses: result.campuses!.map((role) => ({
            id: role.id,
            name: role.name ?? "",
            address: role.address ?? "",
            city: role.city ?? "",
            phone: role.phone ?? "",
            createdAt: role.metadata
              ? new Date(role.metadata.createdAt ?? Date.now())
              : new Date(),
            deleted: role.metadata!.deleted ?? false,
          })),
          totalCampuses: result.totalCampuses ?? 0,
        });
      } else {
        if (message) {
          message.error(tErrorMessages(`${result.status}`));
        }
        setCampusesListState((prev) => ({ ...prev, loading: false }));
      }
    },
    [campusesListState, message, t],
  );

  return {
    campusesListState,
    campuses,
    fetchCampuses,
  };
}
