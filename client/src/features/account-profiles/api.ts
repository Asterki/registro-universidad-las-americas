import axios from "axios";
import * as AccountProfilesAPITypes from "../../../../shared/api/account-profiles";
import ApiUtils from "../../utils/api";

const baseUrl =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_SERVER_URL + "/api/account-profiles"
    : "/api/account-profiles";

const axiosClient = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

export const accountProfilesApi = {
  async getMyProfile(
    data: AccountProfilesAPITypes.GetMyProfileRequestBody,
  ): Promise<AccountProfilesAPITypes.ProfileResponse> {
    try {
      const response =
        await axiosClient.post<AccountProfilesAPITypes.ProfileResponse>(
          "/profile/my",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getStudentProfile(
    data: AccountProfilesAPITypes.GetStudentProfileRequestBody,
  ): Promise<AccountProfilesAPITypes.ProfileResponse> {
    try {
      const response =
        await axiosClient.post<AccountProfilesAPITypes.ProfileResponse>(
          "/profile/student",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async getInstructorProfile(
    data: AccountProfilesAPITypes.GetInstructorProfileRequestBody,
  ): Promise<AccountProfilesAPITypes.ProfileResponse> {
    try {
      const response =
        await axiosClient.post<AccountProfilesAPITypes.ProfileResponse>(
          "/profile/instructor",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async assignCampus(
    data: AccountProfilesAPITypes.AssignInstructorCampusRequestBody,
  ): Promise<AccountProfilesAPITypes.CampusAssignmentResponse> {
    try {
      const response =
        await axiosClient.post<AccountProfilesAPITypes.CampusAssignmentResponse>(
          "/instructor/campus/assign",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async removeCampus(
    data: AccountProfilesAPITypes.RemoveInstructorCampusRequestBody,
  ): Promise<AccountProfilesAPITypes.CampusAssignmentResponse> {
    try {
      const response =
        await axiosClient.post<AccountProfilesAPITypes.CampusAssignmentResponse>(
          "/instructor/campus/remove",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listFacultyStudents(
    data: AccountProfilesAPITypes.ListFacultyStudentsRequestBody,
  ): Promise<AccountProfilesAPITypes.ListFacultyAccountsResponse> {
    try {
      const response =
        await axiosClient.post<AccountProfilesAPITypes.ListFacultyAccountsResponse>(
          "/list/students/faculty",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },

  async listFacultyInstructors(
    data: AccountProfilesAPITypes.ListFacultyInstructorsRequestBody,
  ): Promise<AccountProfilesAPITypes.ListFacultyAccountsResponse> {
    try {
      const response =
        await axiosClient.post<AccountProfilesAPITypes.ListFacultyAccountsResponse>(
          "/list/instructors/faculty",
          data,
        );
      return response.data;
    } catch (error) {
      return ApiUtils.handleAxiosError(error);
    }
  },
};

export default accountProfilesApi;
