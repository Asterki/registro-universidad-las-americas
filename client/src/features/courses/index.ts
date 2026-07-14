import api from "./api";
import * as schemas from "../../../../shared/schemas/courses";

import * as CoursesAPITypes from "../../../../shared/api/courses";

// Hooks
import { useAvailableCourses } from "./hooks/useAvailableCourses";
import { useCourseRoster } from "./hooks/useCourseRoster";
import { useInstructorCourses } from "./hooks/useInstructorCourses";

// Components
import { AvailableCoursesTable } from "./components/AvailableCoursesTable";
import { CourseRosterTable } from "./components/CourseRosterTable";

export type { CoursesAPITypes };
export default {
  api,
  schemas,
  hooks: {
    useAvailableCourses,
    useCourseRoster,
    useInstructorCourses,
  },
  components: {
    AvailableCoursesTable,
    CourseRosterTable,
  },
};
