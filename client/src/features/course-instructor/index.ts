import api from "./api";
import * as CourseInstructorAPITypes from "../../../../shared/api/course-instructor";

import { useMyCourses } from "./hooks/useMyCourses";
import { MyCoursesTable } from "./components/MyCoursesTable";

export type { CourseInstructorAPITypes };
export default {
  api,
  hooks: {
    useMyCourses,
  },
  components: {
    MyCoursesTable,
  },
};
