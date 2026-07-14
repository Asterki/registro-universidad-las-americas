import axios from "axios";
import * as CatalogsAPITypes from "../../../../shared/api/catalogs";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/catalogs"
    : "/api/catalogs";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const catalogsApi = {
  async listCampuses(
    data: CatalogsAPITypes.ListCampusesRequestBody,
  ): Promise<CatalogsAPITypes.ListCampusesResponse> {
    try {
      const response =
        await axiosClient.post<CatalogsAPITypes.ListCampusesResponse>(
          "/campus/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listFaculties(
    data: CatalogsAPITypes.ListFacultiesRequestBody,
  ): Promise<CatalogsAPITypes.ListFacultiesResponse> {
    try {
      const response =
        await axiosClient.post<CatalogsAPITypes.ListFacultiesResponse>(
          "/faculty/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listFacultiesByCampus(
    data: CatalogsAPITypes.ListFacultiesByCampusRequestBody,
  ): Promise<CatalogsAPITypes.ListFacultiesResponse> {
    try {
      const response =
        await axiosClient.post<CatalogsAPITypes.ListFacultiesResponse>(
          "/faculty/list/campus",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listRoles(
    data: CatalogsAPITypes.ListRolesRequestBody,
  ): Promise<CatalogsAPITypes.ListRolesResponse> {
    try {
      const response =
        await axiosClient.post<CatalogsAPITypes.ListRolesResponse>(
          "/roles/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listRequestStatuses(
    data: CatalogsAPITypes.ListRequestStatusesRequestBody,
  ): Promise<CatalogsAPITypes.ListStatusesResponse> {
    try {
      const response =
        await axiosClient.post<CatalogsAPITypes.ListStatusesResponse>(
          "/request-status/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listEnrollmentStatuses(
    data: CatalogsAPITypes.ListEnrollmentStatusesRequestBody,
  ): Promise<CatalogsAPITypes.ListStatusesResponse> {
    try {
      const response =
        await axiosClient.post<CatalogsAPITypes.ListStatusesResponse>(
          "/enrollment-status/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default catalogsApi;
