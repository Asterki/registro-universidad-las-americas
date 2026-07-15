import { useState, useCallback } from "react";

import FacultiesFeature, { ListFaculty, FacultiesAPITypes } from "..";
import { App } from "antd";

type NullableFacultiesListState = {
  [K in keyof FacultiesAPITypes.ListFacultiesRequestBody]?:
    | FacultiesAPITypes.ListFacultiesRequestBody[K]
    | null;
};

type UseFacultiesListOptions = {
  apiList?: typeof FacultiesFeature.api.list;
};

export function useList({
  apiList = FacultiesFeature.api.list,
}: UseFacultiesListOptions) {
  const { message } = App.useApp();

  const [facultiesListState, setFacultiesListState] = useState<
    FacultiesAPITypes.ListFacultiesRequestBody & { loading: boolean }
  >({
    loading: true,
    fields: [
      "metadata.createdAt",
      "metadata.deleted",
      "id",
      "name",
      "code",
      "dean",
      "campusId",
    ],
    count: 50,
    page: 0,
  });

  const [faculties, setFaculties] = useState<{
    totalFaculties: number;
    faculties: ListFaculty[];
  }>({
    faculties: [],
    totalFaculties: 0,
  });

  const fetchFaculties = useCallback(
    async ({
      count = facultiesListState.count,
      page = facultiesListState.page,
      includeDeleted = facultiesListState.includeDeleted,
      search = facultiesListState.search,
    }: NullableFacultiesListState = {}) => {
      setFacultiesListState((prev) => ({ ...prev, loading: true }));

      const result = await apiList({
        ...facultiesListState,
        search: search == null ? undefined : search,
        includeDeleted: includeDeleted == null ? undefined : includeDeleted,
      });

      if (result.status === "success") {
        setFacultiesListState((prev) => {
          return {
            ...prev,
            count: count as number,
            page: page as number,
            search: search == null ? undefined : search,
            includeDeleted: includeDeleted == null ? undefined : includeDeleted,
            loading: false,
          };
        });

        setFaculties({
          faculties: result.faculties!.map((faculty) => ({
            id: faculty.id,
            name: faculty.name ?? "",
            code: faculty.code ?? "",
            dean: faculty.dean ?? "",
            campusId: faculty.campusId ?? "",
            deleted: faculty.metadata!.deleted ?? false,
          })),
          totalFaculties: result.totalFaculties ?? 0,
        });
      } else {
        if (message) {
          message.error(`Error: ${result.status}`);
        }
        setFacultiesListState((prev) => ({ ...prev, loading: false }));
      }
    },
    [facultiesListState, message],
  );

  return {
    facultiesListState,
    faculties,
    fetchFaculties,
  };
}
