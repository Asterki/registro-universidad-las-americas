import { performance } from "perf_hooks";

import prismaClient from "../../config/prisma.js";
import {
  Account,
  Course,
  Enrollment,
  Period,
  Prisma,
} from "@prisma/client";

import LoggingService from "../../services/logging.js";

type TranscriptEntry = {
  periodId: string;
  periodName: string;
  periodStartDate: Date;
  periodEndDate: Date;
  courses: Array<{
    courseId: string;
    code: string;
    name: string;
    credits: number;
    grade: number | null;
    status: string;
  }>;
  totalCredits: number;
  totalPassedCredits: number;
  gpa: number | null;
};

type GetTranscriptParameters = {
  accountId: string;
};

type GetTranscriptOptions = {
  traceId?: string;
  userAccount?: Account;
};

export class StudentNotFoundError extends Error {
  retryable = false;
  constructor(message = "student-not-found") {
    super(message);
    this.name = "StudentNotFoundError";
  }
}

export async function getTranscript(
  params: GetTranscriptParameters,
  options: GetTranscriptOptions = {},
): Promise<TranscriptEntry[]> {
  const startTime = performance.now();

  const { accountId } = params;

  try {
    // verify account exists
    const account = await prismaClient.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new StudentNotFoundError();
    }

    // fetch all enrollments (completed/failed) with course and period info
    const enrollments = await prismaClient.enrollment.findMany({
      where: {
        accountId,
        status: {
          in: ["completed", "failed"],
        },
      },
      include: {
        course: true,
        period: true,
      },
      orderBy: [
        { period: { startDate: "asc" } },
        { course: { name: "asc" } },
      ],
    });

    // group by period
    const periodMap = new Map<string, TranscriptEntry>();

    for (const enrollment of enrollments) {
      const periodId = enrollment.periodId;
      const period = enrollment.period;
      const course = enrollment.course;

      if (!periodMap.has(periodId)) {
        periodMap.set(periodId, {
          periodId,
          periodName: period.name,
          periodStartDate: period.startDate,
          periodEndDate: period.endDate,
          courses: [],
          totalCredits: 0,
          totalPassedCredits: 0,
          gpa: null,
        });
      }

      const entry = periodMap.get(periodId)!;
      const grade = enrollment.finalGrade
        ? Number(enrollment.finalGrade)
        : null;

      entry.courses.push({
        courseId: course.id,
        code: course.code,
        name: course.name,
        credits: course.credits,
        grade,
        status: enrollment.status,
      });

      entry.totalCredits += course.credits;
      if (enrollment.status === "completed" && grade !== null) {
        entry.totalPassedCredits += course.credits;
      }
    }

    // calculate GPA per period
    for (const entry of periodMap.values()) {
      const gradedCourses = entry.courses.filter(
        (c) => c.grade !== null && c.status === "completed",
      );
      if (gradedCourses.length > 0) {
        const totalPoints = gradedCourses.reduce(
          (sum, c) => sum + c.grade! * c.credits,
          0,
        );
        const totalCredits = gradedCourses.reduce(
          (sum, c) => sum + c.credits,
          0,
        );
        entry.gpa =
          totalCredits > 0
            ? Number((totalPoints / totalCredits).toFixed(2))
            : null;
      }
    }

    const transcript = Array.from(periodMap.values());

    const duration = Number((performance.now() - startTime).toFixed(3));

    LoggingService.log({
      source: "services:academic-history:transcript",
      level: "info",
      message: "Transcript generated",
      traceId: options.traceId,
      duration,
      details: {
        accountId,
        periodCount: transcript.length,
      },
      _references: {
        accountId: "Account",
      },
    });

    return transcript;
  } catch (err: any) {
    if (err instanceof StudentNotFoundError) {
      throw err;
    }
    throw err;
  }
}

export type { TranscriptEntry };
