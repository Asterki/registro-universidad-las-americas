import api from "./api";
import * as schemas from "../../../../shared/schemas/courses";

import * as CoursesAPITypes from "../../../../shared/api/courses";

// Hooks
import { useAvailableCourses } from "./hooks/useAvailableCourses";
import { useCourseRoster } from "./hooks/useCourseRoster";
import { useInstructorCourses } from "./hooks/useInstructorCourses";
import { useCourseList } from "./hooks/useCourseList";
import { useCreateCourseModal } from "./hooks/useCreateCourseModal";
import { useUpdateCourseDrawer } from "./hooks/useUpdateCourseDrawer";

// Components
import { AvailableCoursesTable } from "./components/AvailableCoursesTable";
import { CourseRosterTable } from "./components/CourseRosterTable";
import { CoursesTable } from "./components/CoursesTable";
import { CreateCourseModal } from "./components/CreateCourseModal";
import { UpdateCourseDrawer } from "./components/UpdateCourseDrawer";

export type { CoursesAPITypes };
export default {
  api,
  schemas,
  hooks: {
    useAvailableCourses,
    useCourseRoster,
    useInstructorCourses,
    useCourseList,
    useCreateCourseModal,
    useUpdateCourseDrawer,
  },
  components: {
    AvailableCoursesTable,
    CourseRosterTable,
    CoursesTable,
    CreateCourseModal,
    UpdateCourseDrawer,
  },
};
