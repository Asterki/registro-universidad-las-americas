import { useState, useCallback } from "react";

import CoursesFeature, { CoursesAPITypes } from "..";
import { App } from "antd";

export interface ListCourse {
  id: string;
  name: string;
  code: string;
  credits: number;
  facultyId: string;
  periodId: string;
  deleted: boolean;
}

type NullableCoursesListState = {
  [K in keyof CoursesAPITypes.ListCoursesRequestBody]?:
    | CoursesAPITypes.ListCoursesRequestBody[K]
    | null;
};

type UseCourseListOptions = {
  apiList?: typeof CoursesFeature.api.list;
};

export function useCourseList({
  apiList = CoursesFeature.api.list,
}: UseCourseListOptions) {
  const { message } = App.useApp();

  const [coursesListState, setCoursesListState] = useState<
    CoursesAPITypes.ListCoursesRequestBody & { loading: boolean }
  >({
    loading: true,
    fields: [
      "metadata.createdAt",
      "metadata.deleted",
      "id",
      "name",
      "code",
      "credits",
      "facultyId",
      "periodId",
    ],
    count: 50,
    page: 0,
  });

  const [courses, setCourses] = useState<{
    totalCourses: number;
    courses: ListCourse[];
  }>({
    courses: [],
    totalCourses: 0,
  });

  const fetchCourses = useCallback(
    async ({
      count = coursesListState.count,
      page = coursesListState.page,
      includeDeleted = coursesListState.includeDeleted,
      search = coursesListState.search,
      facultyId = coursesListState.facultyId,
      periodId = coursesListState.periodId,
    }: NullableCoursesListState = {}) => {
      setCoursesListState((prev) => ({ ...prev, loading: true }));

      const result = await apiList({
        ...coursesListState,
        search: search == null ? undefined : search,
        includeDeleted: includeDeleted == null ? undefined : includeDeleted,
        facultyId: facultyId == null ? undefined : facultyId,
        periodId: periodId == null ? undefined : periodId,
      });

      if (result.status === "success") {
        setCoursesListState((prev) => {
          return {
            ...prev,
            count: count as number,
            page: page as number,
            search: search == null ? undefined : search,
            includeDeleted: includeDeleted == null ? undefined : includeDeleted,
            facultyId: facultyId == null ? undefined : facultyId,
            periodId: periodId == null ? undefined : periodId,
            loading: false,
          };
        });

        setCourses({
          courses: result.courses!.map((course: any) => ({
            id: course.id,
            name: course.name ?? "",
            code: course.code ?? "",
            credits: course.credits ?? 0,
            facultyId: course.facultyId ?? "",
            periodId: course.periodId ?? "",
            deleted: course.metadata?.deleted ?? false,
          })),
          totalCourses: result.totalCourses ?? 0,
        });
      } else {
        if (message) {
          message.error(`Error: ${result.status}`);
        }
        setCoursesListState((prev) => ({ ...prev, loading: false }));
      }
    },
    [coursesListState, message],
  );

  return {
    coursesListState,
    courses,
    fetchCourses,
  };
}
