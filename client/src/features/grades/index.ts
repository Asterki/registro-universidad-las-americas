import api from "./api";
import * as GradesAPITypes from "../../../../shared/api/grades";

import { useRecordGrade } from "./hooks/useRecordGrade";
import { useCourseGrades } from "./hooks/useCourseGrades";
import { useMyGrades } from "./hooks/useMyGrades";
import { GradeRecordForm } from "./components/GradeRecordForm";
import { CourseGradesTable } from "./components/CourseGradesTable";
import { MyGradesTable } from "./components/MyGradesTable";

export type { GradesAPITypes };
export default {
  api,
  hooks: {
    useRecordGrade,
    useCourseGrades,
    useMyGrades,
  },
  components: {
    GradeRecordForm,
    CourseGradesTable,
    MyGradesTable,
  },
};
