import axios from "axios";
import * as RequestsAPITypes from "../../../../shared/api/requests";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/requests"
    : "/api/requests";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const requestsApi = {
  async create(
    data: RequestsAPITypes.CreateMyRequestRequestBody,
  ): Promise<RequestsAPITypes.RequestResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.RequestResponse>(
          "/create",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async createForStudent(
    data: RequestsAPITypes.CreateRequestForStudentRequestBody,
  ): Promise<RequestsAPITypes.RequestResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.RequestResponse>(
          "/create/student",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listMy(
    data: RequestsAPITypes.ListMyRequestsRequestBody,
  ): Promise<RequestsAPITypes.ListRequestsResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.ListRequestsResponse>(
          "/list/my",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async list(
    data: RequestsAPITypes.ListRequestsRequestBody,
  ): Promise<RequestsAPITypes.ListRequestsResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.ListRequestsResponse>(
          "/list",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getDetail(
    data: RequestsAPITypes.GetRequestDetailRequestBody,
  ): Promise<RequestsAPITypes.RequestResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.RequestResponse>(
          "/detail",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async approve(
    data: RequestsAPITypes.ApproveRequestRequestBody,
  ): Promise<RequestsAPITypes.RequestResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.RequestResponse>(
          "/approve",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async reject(
    data: RequestsAPITypes.RejectRequestRequestBody,
  ): Promise<RequestsAPITypes.RequestResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.RequestResponse>(
          "/reject",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async review(
    data: RequestsAPITypes.ReviewRequestRequestBody,
  ): Promise<RequestsAPITypes.RequestResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.RequestResponse>(
          "/review",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async resolve(
    data: RequestsAPITypes.ResolveRequestRequestBody,
  ): Promise<RequestsAPITypes.RequestResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.RequestResponse>(
          "/resolve",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async assign(
    data: RequestsAPITypes.AssignRequestRequestBody,
  ): Promise<RequestsAPITypes.RequestResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.RequestResponse>(
          "/assign",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async addResponse(
    data: RequestsAPITypes.AddRequestResponseRequestBody,
  ): Promise<RequestsAPITypes.RequestResponse> {
    try {
      const response =
        await axiosClient.post<RequestsAPITypes.RequestResponse>(
          "/response/add",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default requestsApi;
