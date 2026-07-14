import axios from "axios";
import * as EnrollmentAPITypes from "../../../../shared/api/enrollment";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/enrollment"
    : "/api/enrollment";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const enrollmentApi = {
  async enrollSelf(
    data: EnrollmentAPITypes.EnrollSelfRequestBody,
  ): Promise<EnrollmentAPITypes.EnrollResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.EnrollResponse>(
          "/enroll",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async enrollStudent(
    data: EnrollmentAPITypes.EnrollStudentRequestBody,
  ): Promise<EnrollmentAPITypes.EnrollResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.EnrollResponse>(
          "/enroll/student",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async cancelSelf(
    data: EnrollmentAPITypes.CancelSelfRequestBody,
  ): Promise<EnrollmentAPITypes.CancelResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.CancelResponse>(
          "/cancel",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async cancelStudent(
    data: EnrollmentAPITypes.CancelStudentRequestBody,
  ): Promise<EnrollmentAPITypes.CancelResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.CancelResponse>(
          "/cancel/student",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async validate(
    data: EnrollmentAPITypes.ValidateEnrollmentRequestBody,
  ): Promise<EnrollmentAPITypes.ValidateResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.ValidateResponse>(
          "/validate",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listMy(
    data: EnrollmentAPITypes.ListMyEnrollmentsRequestBody,
  ): Promise<EnrollmentAPITypes.ListEnrollmentsResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.ListEnrollmentsResponse>(
          "/list/my",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listStudent(
    data: EnrollmentAPITypes.ListStudentEnrollmentsRequestBody,
  ): Promise<EnrollmentAPITypes.ListEnrollmentsResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.ListEnrollmentsResponse>(
          "/list/student",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listCourse(
    data: EnrollmentAPITypes.ListCourseEnrollmentsRequestBody,
  ): Promise<EnrollmentAPITypes.ListEnrollmentsResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.ListEnrollmentsResponse>(
          "/list/course",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getDetail(
    data: EnrollmentAPITypes.GetEnrollmentDetailRequestBody,
  ): Promise<EnrollmentAPITypes.EnrollmentDetailResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.EnrollmentDetailResponse>(
          "/detail",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async complete(
    data: EnrollmentAPITypes.CompleteEnrollmentRequestBody,
  ): Promise<EnrollmentAPITypes.EnrollmentStatusResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.EnrollmentStatusResponse>(
          "/complete",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async fail(
    data: EnrollmentAPITypes.FailEnrollmentRequestBody,
  ): Promise<EnrollmentAPITypes.EnrollmentStatusResponse> {
    try {
      const response =
        await axiosClient.post<EnrollmentAPITypes.EnrollmentStatusResponse>(
          "/fail",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default enrollmentApi;
