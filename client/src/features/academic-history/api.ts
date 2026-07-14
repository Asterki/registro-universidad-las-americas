import axios from "axios";
import * as AcademicHistoryAPITypes from "../../../../shared/api/academic-history";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/academic-history"
    : "/api/academic-history";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const academicHistoryApi = {
  async getMy(
    data: AcademicHistoryAPITypes.GetMyAcademicHistoryRequestBody,
  ): Promise<AcademicHistoryAPITypes.AcademicHistoryResponse> {
    try {
      const response =
        await axiosClient.post<AcademicHistoryAPITypes.AcademicHistoryResponse>(
          "/get/my",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getStudent(
    data: AcademicHistoryAPITypes.GetStudentAcademicHistoryRequestBody,
  ): Promise<AcademicHistoryAPITypes.AcademicHistoryResponse> {
    try {
      const response =
        await axiosClient.post<AcademicHistoryAPITypes.AcademicHistoryResponse>(
          "/get/student",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getTranscript(
    data: AcademicHistoryAPITypes.GetTranscriptRequestBody,
  ): Promise<AcademicHistoryAPITypes.TranscriptResponse> {
    try {
      const response =
        await axiosClient.post<AcademicHistoryAPITypes.TranscriptResponse>(
          "/transcript",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async checkPrerequisites(
    data: AcademicHistoryAPITypes.CheckPrerequisitesRequestBody,
  ): Promise<AcademicHistoryAPITypes.PrerequisitesResponse> {
    try {
      const response =
        await axiosClient.post<AcademicHistoryAPITypes.PrerequisitesResponse>(
          "/check/prerequisites",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default academicHistoryApi;
