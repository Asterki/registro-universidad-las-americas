import axios from "axios";
import * as RegistryAPITypes from "../../../../shared/api/registry";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/registry"
    : "/api/registry";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const registryApi = {
  async listRequests(
    data: RegistryAPITypes.ListAllAcademicRequestsRequestBody,
  ): Promise<RegistryAPITypes.ListAllRequestsResponse> {
    try {
      const response =
        await axiosClient.post<RegistryAPITypes.ListAllRequestsResponse>(
          "/requests/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async processRequest(
    data: RegistryAPITypes.ProcessAcademicRequestRequestBody,
  ): Promise<RegistryAPITypes.ProcessRequestResponse> {
    try {
      const response =
        await axiosClient.post<RegistryAPITypes.ProcessRequestResponse>(
          "/requests/process",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listInstructors(
    data: RegistryAPITypes.ListAllInstructorsRequestBody,
  ): Promise<RegistryAPITypes.ListAllInstructorsResponse> {
    try {
      const response =
        await axiosClient.post<RegistryAPITypes.ListAllInstructorsResponse>(
          "/instructors/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default registryApi;
