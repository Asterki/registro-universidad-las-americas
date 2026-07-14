import axios from "axios";
import * as GradesAPITypes from "../../../../shared/api/grades";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/grades"
    : "/api/grades";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const gradesApi = {
  async record(
    data: GradesAPITypes.RecordGradeRequestBody,
  ): Promise<GradesAPITypes.GradeResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.GradeResponse>(
          "/record",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async update(
    data: GradesAPITypes.UpdateGradeRequestBody,
  ): Promise<GradesAPITypes.GradeResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.GradeResponse>(
          "/update",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async delete(
    data: GradesAPITypes.DeleteGradeRequestBody,
  ): Promise<GradesAPITypes.GradeResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.GradeResponse>(
          "/delete",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listMy(
    data: GradesAPITypes.ListMyGradesRequestBody,
  ): Promise<GradesAPITypes.ListGradesResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.ListGradesResponse>(
          "/list/my",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listStudent(
    data: GradesAPITypes.ListStudentGradesRequestBody,
  ): Promise<GradesAPITypes.ListGradesResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.ListGradesResponse>(
          "/list/student",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listCourse(
    data: GradesAPITypes.ListCourseGradesRequestBody,
  ): Promise<GradesAPITypes.ListGradesResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.ListGradesResponse>(
          "/list/course",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listFaculty(
    data: GradesAPITypes.ListFacultyGradesRequestBody,
  ): Promise<GradesAPITypes.ListGradesResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.ListGradesResponse>(
          "/list/faculty",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getDetail(
    data: GradesAPITypes.GetGradeDetailRequestBody,
  ): Promise<GradesAPITypes.GradeDetailResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.GradeDetailResponse>(
          "/detail",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async publishFinal(
    data: GradesAPITypes.PublishFinalGradeRequestBody,
  ): Promise<GradesAPITypes.GradeResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.GradeResponse>(
          "/final/publish",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async bulkRecord(
    data: GradesAPITypes.BulkRecordGradesRequestBody,
  ): Promise<GradesAPITypes.BulkGradesResponse> {
    try {
      const response =
        await axiosClient.post<GradesAPITypes.BulkGradesResponse>(
          "/record/bulk",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default gradesApi;
