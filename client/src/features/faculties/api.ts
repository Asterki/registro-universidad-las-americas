import axios from "axios";
import * as FacultiesAPITypes from "../../../../shared/api/faculties";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/faculties"
    : "/api/faculties";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const facultiesApi = {
  async get(
    data: FacultiesAPITypes.GetFacultyRequestBody,
  ): Promise<FacultiesAPITypes.GetFacultyResponseData> {
    try {
      const response = await axiosClient.post<FacultiesAPITypes.GetFacultyResponseData>(
        "/get",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async list(
    data: FacultiesAPITypes.ListFacultiesRequestBody,
  ): Promise<FacultiesAPITypes.ListFacultiesResponseData> {
    try {
      const response = await axiosClient.post<FacultiesAPITypes.ListFacultiesResponseData>(
        "/list",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async create(
    data: FacultiesAPITypes.CreateFacultyRequestBody,
  ): Promise<FacultiesAPITypes.CreateFacultyResponseData> {
    try {
      const response = await axiosClient.post<FacultiesAPITypes.CreateFacultyResponseData>(
        "/create",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async update(
    data: FacultiesAPITypes.UpdateFacultyRequestBody,
  ): Promise<FacultiesAPITypes.UpdateFacultyResponseData> {
    try {
      const response = await axiosClient.post<FacultiesAPITypes.UpdateFacultyResponseData>(
        "/update",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async delete(
    data: FacultiesAPITypes.DeleteFacultyRequestBody,
  ): Promise<FacultiesAPITypes.DeleteFacultyResponseData> {
    try {
      const response = await axiosClient.post<FacultiesAPITypes.DeleteFacultyResponseData>(
        "/delete",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async restore(
    data: FacultiesAPITypes.RestoreFacultyRequestBody,
  ): Promise<FacultiesAPITypes.RestoreFacultyResponseData> {
    try {
      const response = await axiosClient.post<FacultiesAPITypes.RestoreFacultyResponseData>(
        "/restore",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default facultiesApi;
