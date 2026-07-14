import axios from "axios";
import * as CoordinatorAPITypes from "../../../../shared/api/coordinator";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/coordinator"
    : "/api/coordinator";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const coordinatorApi = {
  async getScope(
    data: CoordinatorAPITypes.GetCoordinatorFacultyScopeRequestBody,
  ): Promise<CoordinatorAPITypes.CoordinatorScopeResponse> {
    try {
      const response =
        await axiosClient.post<CoordinatorAPITypes.CoordinatorScopeResponse>(
          "/scope/get",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listCourses(
    data: CoordinatorAPITypes.ListCoordinatorCoursesRequestBody,
  ): Promise<CoordinatorAPITypes.CoordinatorCoursesResponse> {
    try {
      const response =
        await axiosClient.post<CoordinatorAPITypes.CoordinatorCoursesResponse>(
          "/courses/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listStudents(
    data: CoordinatorAPITypes.ListCoordinatorStudentsRequestBody,
  ): Promise<CoordinatorAPITypes.CoordinatorStudentsResponse> {
    try {
      const response =
        await axiosClient.post<CoordinatorAPITypes.CoordinatorStudentsResponse>(
          "/students/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default coordinatorApi;
