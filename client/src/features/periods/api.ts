import axios from "axios";
import * as PeriodsAPITypes from "../../../../shared/api/period";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/periods"
    : "/api/periods";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const periodsApi = {
  async get(
    data: PeriodsAPITypes.GetPeriodRequestBody,
  ): Promise<PeriodsAPITypes.ListAllPeriodsResponseData> {
    try {
      const response = await axiosClient.post<PeriodsAPITypes.ListAllPeriodsResponseData>(
        "/get",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async list(
    data: PeriodsAPITypes.ListAllPeriodsRequestBody,
  ): Promise<PeriodsAPITypes.ListAllPeriodsResponseData> {
    try {
      const response = await axiosClient.post<PeriodsAPITypes.ListAllPeriodsResponseData>(
        "/list",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async create(
    data: PeriodsAPITypes.CreatePeriodRequestBody,
  ): Promise<PeriodsAPITypes.CreatePeriodResponseData> {
    try {
      const response = await axiosClient.post<PeriodsAPITypes.CreatePeriodResponseData>(
        "/create",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async update(
    data: PeriodsAPITypes.UpdatePeriodRequestBody,
  ): Promise<PeriodsAPITypes.UpdatePeriodResponseData> {
    try {
      const response = await axiosClient.post<PeriodsAPITypes.UpdatePeriodResponseData>(
        "/update",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async delete(
    data: PeriodsAPITypes.DeletePeriodRequestBody,
  ): Promise<PeriodsAPITypes.DeletePeriodResponseData> {
    try {
      const response = await axiosClient.post<PeriodsAPITypes.DeletePeriodResponseData>(
        "/delete",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async restore(
    data: PeriodsAPITypes.RestorePeriodRequestBody,
  ): Promise<PeriodsAPITypes.RestorePeriodResponseData> {
    try {
      const response = await axiosClient.post<PeriodsAPITypes.RestorePeriodResponseData>(
        "/restore",
        data,
      );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default periodsApi;
