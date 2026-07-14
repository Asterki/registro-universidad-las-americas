import axios from "axios";
import * as CoursesAPITypes from "../../../../shared/api/courses";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/courses"
    : "/api/courses";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const coursesApi = {
  async listByPeriod(
    data: CoursesAPITypes.ListCoursesByPeriodRequestBody,
  ): Promise<CoursesAPITypes.ListCoursesResponse> {
    try {
      const response =
        await axiosClient.post<CoursesAPITypes.ListCoursesResponse>(
          "/list/period",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listByFaculty(
    data: CoursesAPITypes.ListCoursesByFacultyRequestBody,
  ): Promise<CoursesAPITypes.ListCoursesResponse> {
    try {
      const response =
        await axiosClient.post<CoursesAPITypes.ListCoursesResponse>(
          "/list/faculty",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getDetail(
    data: CoursesAPITypes.GetCourseDetailRequestBody,
  ): Promise<CoursesAPITypes.CourseDetailResponse> {
    try {
      const response =
        await axiosClient.post<CoursesAPITypes.CourseDetailResponse>(
          "/detail",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getPrerequisites(
    data: CoursesAPITypes.GetCoursePrerequisitesRequestBody,
  ): Promise<CoursesAPITypes.CoursePrerequisitesResponse> {
    try {
      const response =
        await axiosClient.post<CoursesAPITypes.CoursePrerequisitesResponse>(
          "/prerequisites/get",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listAvailable(
    data: CoursesAPITypes.ListAvailableCoursesForStudentRequestBody,
  ): Promise<CoursesAPITypes.ListCoursesResponse> {
    try {
      const response =
        await axiosClient.post<CoursesAPITypes.ListCoursesResponse>(
          "/list/available",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getRoster(
    data: CoursesAPITypes.GetCourseRosterRequestBody,
  ): Promise<CoursesAPITypes.CourseRosterResponse> {
    try {
      const response =
        await axiosClient.post<CoursesAPITypes.CourseRosterResponse>(
          "/roster/get",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default coursesApi;
