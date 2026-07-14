import axios from "axios";
import * as CourseInstructorAPITypes from "../../../../shared/api/course-instructor";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/course-instructor"
    : "/api/course-instructor";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const courseInstructorApi = {
  async assign(
    data: CourseInstructorAPITypes.AssignInstructorRequestBody,
  ): Promise<CourseInstructorAPITypes.CourseInstructorResponse> {
    try {
      const response =
        await axiosClient.post<CourseInstructorAPITypes.CourseInstructorResponse>(
          "/assign",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async remove(
    data: CourseInstructorAPITypes.RemoveInstructorRequestBody,
  ): Promise<CourseInstructorAPITypes.CourseInstructorResponse> {
    try {
      const response =
        await axiosClient.post<CourseInstructorAPITypes.CourseInstructorResponse>(
          "/remove",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listCourse(
    data: CourseInstructorAPITypes.ListCourseInstructorsRequestBody,
  ): Promise<CourseInstructorAPITypes.ListCourseInstructorsResponse> {
    try {
      const response =
        await axiosClient.post<CourseInstructorAPITypes.ListCourseInstructorsResponse>(
          "/list/course",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listInstructor(
    data: CourseInstructorAPITypes.ListInstructorCoursesRequestBody,
  ): Promise<CourseInstructorAPITypes.ListInstructorCoursesResponse> {
    try {
      const response =
        await axiosClient.post<CourseInstructorAPITypes.ListInstructorCoursesResponse>(
          "/list/instructor",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async activate(
    data: CourseInstructorAPITypes.ActivateInstructorAssignmentRequestBody,
  ): Promise<CourseInstructorAPITypes.CourseInstructorResponse> {
    try {
      const response =
        await axiosClient.post<CourseInstructorAPITypes.CourseInstructorResponse>(
          "/activate",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async deactivate(
    data: CourseInstructorAPITypes.DeactivateInstructorAssignmentRequestBody,
  ): Promise<CourseInstructorAPITypes.CourseInstructorResponse> {
    try {
      const response =
        await axiosClient.post<CourseInstructorAPITypes.CourseInstructorResponse>(
          "/deactivate",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default courseInstructorApi;
