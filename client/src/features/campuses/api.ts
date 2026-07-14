import axios from "axios";
import * as CampusesAPITypes from "../../../../shared/api/campus";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/campuses"
    : "/api/campuses";

// Create an Axios client with credentials enabled by default
const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true, // Always include credentials
});

export const campusesApi = {
  async create(
    data: CampusesAPITypes.CreateRequestBody,
  ): Promise<CampusesAPITypes.CreateResponseData> {
    try {
      const response = await axiosClient.post<CampusesAPITypes.CreateResponseData>(
        "/create",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async get(
    data: CampusesAPITypes.GetRequestBody,
  ): Promise<CampusesAPITypes.GetResponseData> {
    try {
      const response = await axiosClient.post<CampusesAPITypes.GetResponseData>(
        "/get",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async update(
    data: CampusesAPITypes.UpdateRequestBody,
  ): Promise<CampusesAPITypes.UpdateResponseData> {
    try {
      const response = await axiosClient.post<CampusesAPITypes.UpdateResponseData>(
        "/update",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async delete(
    data: CampusesAPITypes.DeleteRequestBody,
  ): Promise<CampusesAPITypes.DeleteResponseData> {
    try {
      const response = await axiosClient.post<CampusesAPITypes.DeleteResponseData>(
        "/delete",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async restore(
    data: CampusesAPITypes.RestoreRequestBody,
  ): Promise<CampusesAPITypes.RestoreResponseData> {
    try {
      const response =
        await axiosClient.post<CampusesAPITypes.RestoreResponseData>(
          "/restore",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async list(
    data: CampusesAPITypes.ListRequestBody,
  ): Promise<CampusesAPITypes.ListResponseData> {
    try {
      const response = await axiosClient.post<CampusesAPITypes.ListResponseData>(
        "/list",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default campusesApi;
