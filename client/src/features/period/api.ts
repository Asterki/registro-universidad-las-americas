import axios from "axios";
import * as PeriodAPITypes from "../../../../shared/api/period";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/period"
    : "/api/period";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const periodApi = {
  async list(
    data: PeriodAPITypes.ListPeriodsRequestBody,
  ): Promise<PeriodAPITypes.ListPeriodsResponse> {
    try {
      const response =
        await axiosClient.post<PeriodAPITypes.ListPeriodsResponse>(
          "/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getActive(
    data: PeriodAPITypes.GetActivePeriodRequestBody,
  ): Promise<PeriodAPITypes.PeriodResponse> {
    try {
      const response =
        await axiosClient.post<PeriodAPITypes.PeriodResponse>(
          "/get/active",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getDetail(
    data: PeriodAPITypes.GetPeriodDetailRequestBody,
  ): Promise<PeriodAPITypes.PeriodResponse> {
    try {
      const response =
        await axiosClient.post<PeriodAPITypes.PeriodResponse>(
          "/detail",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default periodApi;
