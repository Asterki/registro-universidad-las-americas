// demo.ts
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker/locale/es";
import prismaClient from "./config/prisma.js";

const HASH_ROUNDS = 10;
const hash = (p: string) => bcrypt.hash(p, HASH_ROUNDS);

/**
 * Centralized Metadata creator.
 * Prisma's generated types use a discriminated union (Checked vs Unchecked
 * create input). Mixing scalar FKs (e.g. campusId) with a nested
 * `metadata: { create: {...} } }` on the SAME model forces TS to resolve
 * the wrong branch of that union and throws the "not assignable" error.
 * The fix: always create Metadata first, then attach it via the scalar
 * `metadataId` field, keeping every model in the "Unchecked" shape.
 */
const createMetadata = async (
  tags: string,
  extra: Partial<{
    createdById: string;
    updatedById: string;
    status: "active" | "inactive";
    source: "manual" | "imported";
    notes: string;
  }> = {},
) => {
  const metadata = await prismaClient.metadata.create({
    data: {
      documentVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deleted: false,
      status: "active",
      source: "manual",
      tags,
      ...extra,
    },
  });
  return metadata.id;
};

const resetDatabase = async () => {
  await prismaClient.log.deleteMany({});
  await prismaClient.metadataUpdateHistory.deleteMany({});
  await prismaClient.grade.deleteMany({});
  await prismaClient.enrollment.deleteMany({});
  await prismaClient.request.deleteMany({});
  await prismaClient.coordinator.deleteMany({});
  await prismaClient.courseInstructor.deleteMany({});
  await prismaClient.prerequisite.deleteMany({});
  await prismaClient.course.deleteMany({});
  await prismaClient.period.deleteMany({});
  await prismaClient.faculty.deleteMany({});
  await prismaClient.campus.deleteMany({});
  await prismaClient.config.deleteMany({});
  await prismaClient.account.deleteMany({});
  await prismaClient.accountRole.deleteMany({});
  await prismaClient.metadata.deleteMany({});
  await prismaClient.session.deleteMany({});
};

const campusNames = ["COMAYAGUA", "TEGUCIGALPA", "SAN PEDRO SULA", "LA CEIBA"];
const facultyCodes = ["FING", "FMED", "FDER", "FADM", "FCIEN"];
const facultyNames = [
  "Facultad de Ingenieria",
  "Facultad de Medicina",
  "Facultad de Derecho",
  "Facultad de Administracion",
  "Facultad de Ciencias",
];
const deans = [
  "Dr. Carlos Mejia",
  "Dra. Maria Flores",
  "Dr. Roberto Zavala",
  "Dra. Lucia Aguilar",
  "Dr. Ernesto Paz",
];

const courseNames = [
  "Calculo I",
  "Algebra Lineal",
  "Fisica General",
  "Programacion I",
  "Estadistica",
  "Base de Datos",
  "Redes de Computadoras",
  "Sistemas Operativos",
  "Economia General",
  "Derecho Civil",
];
const courseCodes = [
  "CAL1",
  "ALG1",
  "FIS1",
  "PRG1",
  "EST1",
  "BDD1",
  "RED1",
  "SOP1",
  "ECO1",
  "DER1",
];

const specialties = [
  "Ingenieria de Software",
  "Matematicas Aplicadas",
  "Fisica Computacional",
  "Redes y Telecomunicaciones",
  "Administracion Academica",
];
const contractTypes = ["Tiempo Completo", "Medio Tiempo", "Por Hora"];

const requestTypes = [
  "Revision de Nota",
  "Constancia de Estudios",
  "Cambio de Seccion",
  "Retiro de Asignatura",
  "Certificado de Graduacion",
];

const gradeDescriptions = [
  "Primer Parcial",
  "Segundo Parcial",
  "Tercer Parcial",
  "Tarea 1",
  "Tarea 2",
  "Laboratorio 1",
  "Proyecto Final",
];

const demo = async () => {
  console.log("[DEMO] Reseteando base de datos...");
  await resetDatabase();
  console.log("[DEMO] Base de datos limpia, iniciando carga...");

  console.log("[DEMO] Iniciando carga de datos de demostracion...");

  // Roles
  console.log("[DEMO] Creando roles...");
  const roleDefinitions = [
    {
      name: "Administrador",
      level: -1,
      isSystemRole: true,
      permissions: "*",
      requiresTwoFactor: true,
    },
    {
      name: "Registraduria",
      level: 1,
      isSystemRole: true,
      permissions:
        "accounts:read,accounts:write,enrollments:*,grades:*,requests:*",
    },
    {
      name: "Docente",
      level: 2,
      isSystemRole: false,
      permissions: "grades:write,courses:read,enrollments:read",
    },
    {
      name: "Coordinador",
      level: 3,
      isSystemRole: false,
      permissions: "courses:*,enrollments:read,requests:read",
    },
    {
      name: "Estudiante",
      level: 4,
      isSystemRole: false,
      permissions: "enrollments:read,grades:read,requests:write",
    },
  ];

  const roles: Record<string, { id: string }> = {};
  for (const def of roleDefinitions) {
    const existing = await prismaClient.accountRole.findUnique({
      where: { name: def.name },
    });
    if (existing) {
      roles[def.name] = existing;
      continue;
    }
    const metadataId = await createMetadata("rol,demo");
    const role = await prismaClient.accountRole.create({
      data: {
        name: def.name,
        level: def.level,
        isSystemRole: def.isSystemRole,
        permissions: def.permissions,
        requiresTwoFactor: def.requiresTwoFactor ?? false,
        description: `Rol de ${def.name} del sistema academico`,
        metadataId,
      },
    });
    roles[def.name] = role;
    console.log(`  ok Rol: ${def.name}`);
  }

  // Config
  const configCount = await prismaClient.config.count();
  if (configCount === 0) {
    const metadataId = await createMetadata("config,demo");
    await prismaClient.config.create({
      data: {
        currencySymbol: "L",
        dateFormat: "DD_MM_YYYY",
        timeFormat: "HH_MM_12",
        metadataId,
      },
    });
    console.log("[DEMO] ok Configuracion del sistema creada");
  }

  // Campuses
  console.log("[DEMO] Creando campus...");
  const campuses: { id: string; name: string }[] = [];
  for (const campusName of campusNames) {
    const metadataId = await createMetadata("campus,demo");
    const campus = await prismaClient.campus.create({
      data: {
        name: campusName,
        city: campusName,
        address: `Blvd. ${faker.location.street()}, ${campusName}`,
        phone: `+504 ${faker.string.numeric(4)}-${faker.string.numeric(4)}`,
        metadataId,
      },
    });
    campuses.push(campus);
    console.log(`  ok Campus: ${campus.name}`);
  }

  // Faculties
  console.log("[DEMO] Creando facultades...");
  const faculties: { id: string; campusId: string }[] = [];
  for (let i = 0; i < facultyCodes.length; i++) {
    const campus = faker.helpers.arrayElement(campuses);
    const metadataId = await createMetadata("facultad,demo");
    const faculty = await prismaClient.faculty.create({
      data: {
        name: facultyNames[i],
        code: `${facultyCodes[i]}${faker.string.numeric(3)}`,
        dean: deans[i],
        campusId: campus.id,
        metadataId,
      },
    });
    faculties.push(faculty);
    console.log(`  ok Facultad: ${facultyNames[i]}`);
  }

  // Periods
  console.log("[DEMO] Creando periodos academicos...");
  const periodDefs = [
    {
      name: "I Periodo 2025",
      start: new Date("2025-01-20"),
      end: new Date("2025-05-30"),
      active: false,
    },
    {
      name: "II Periodo 2025",
      start: new Date("2025-07-07"),
      end: new Date("2025-11-28"),
      active: false,
    },
    {
      name: "I Periodo 2026",
      start: new Date("2026-01-19"),
      end: new Date("2026-05-29"),
      active: true,
    },
  ];
  const periods: { id: string; active: boolean }[] = [];
  for (const pd of periodDefs) {
    const metadataId = await createMetadata("periodo,demo");
    const period = await prismaClient.period.create({
      data: {
        name: pd.name,
        startDate: pd.start,
        endDate: pd.end,
        active: pd.active,
        metadataId,
      },
    });
    periods.push(period);
    console.log(`  ok Periodo: ${pd.name}`);
  }

  // Teacher accounts
  console.log("[DEMO] Creando cuentas de docentes...");
  const teachers: { id: string; campusId: string; facultyId: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const faculty = faker.helpers.arrayElement(faculties);
    const campus = campuses.find((c) => c.id === faculty.campusId)!;
    const metadataId = await createMetadata("docente,demo");

    const teacher = await prismaClient.account.create({
      data: {
        roleId: roles["Docente"].id,
        status: "active",
        email: faker.internet
          .email({ firstName, lastName, provider: "unah.edu.hn" })
          .toLowerCase(),
        emailVerified: true,
        emailLastChanged: new Date(),
        name: `${firstName} ${lastName}`,
        phone: `+504 ${faker.string.numeric(4)}-${faker.string.numeric(4)}`,
        birthDate: faker.date.birthdate({ min: 28, max: 60, mode: "age" }),
        password: await hash("docente123"),
        lastPasswordChange: new Date(),
        lastLogin: faker.date.recent({ days: 30 }),
        specialty: faker.helpers.arrayElement(specialties),
        contractType: faker.helpers.arrayElement(contractTypes),
        campusId: campus.id,
        facultyId: faculty.id,
        metadataId,
      },
    });
    teachers.push({
      id: teacher.id,
      campusId: campus.id,
      facultyId: faculty.id,
    });
    console.log(`  ok Docente: ${teacher.name}`);
  }

  // Admin Account
  console.log("[DEMO] Creando cuenta de administrador...");
  const adminMetadataId = await createMetadata("admin,demo");
  const adminAccount = await prismaClient.account.create({
    data: {
      roleId: roles["Administrador"].id,
      status: "active",
      email: "admin@local.test",
      emailVerified: true,
      emailLastChanged: new Date(),
      name: "Administrador",
      phone: null,
      birthDate: null,
      password: await hash("admin123"),
      lastPasswordChange: new Date(),
      lastLogin: faker.date.recent({ days: 30 }),
      specialty: null,
      contractType: null,
      campusId: null,
      facultyId: null,
      metadataId: adminMetadataId,
    },
  });

  // Student accounts
  console.log("[DEMO] Creando cuentas de estudiantes...");
  const students: { id: string }[] = [];
  const academicStatuses: (
    | "active"
    | "inactive"
    | "graduated"
    | "suspended"
  )[] = [
    "active",
    "active",
    "active",
    "active",
    "inactive",
    "graduated",
    "suspended",
  ];

  for (let i = 0; i < 40; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const yearPrefix = faker.helpers.arrayElement([
      "20211",
      "20221",
      "20231",
      "20241",
    ]);
    const metadataId = await createMetadata("estudiante,demo");

    const student = await prismaClient.account.create({
      data: {
        roleId: roles["Estudiante"].id,
        status: "active",
        email: faker.internet
          .email({ firstName, lastName, provider: "unah.edu.hn" })
          .toLowerCase(),
        emailVerified: faker.datatype.boolean(0.8),
        emailLastChanged: new Date(),
        name: `${firstName} ${lastName}`,
        phone:
          faker.helpers.maybe(
            () => `+504 ${faker.string.numeric(4)}-${faker.string.numeric(4)}`,
            { probability: 0.7 },
          ) ?? null,
        birthDate: faker.date.birthdate({ min: 17, max: 30, mode: "age" }),
        password: await hash("estudiante123"),
        lastPasswordChange: new Date(),
        lastLogin: faker.date.recent({ days: 60 }),
        accountNumber: `${yearPrefix}${faker.string.numeric(5)}`,
        academicStatus: faker.helpers.arrayElement(academicStatuses),
        enrollmentDate: faker.date.past({ years: 4 }),
        metadataId,
      },
    });
    students.push(student);
    if (i % 10 === 9) console.log(`  ok ${i + 1} estudiantes creados...`);
  }

  // Courses
  console.log("[DEMO] Creando cursos...");
  const courses: { id: string; facultyId: string; periodId: string }[] = [];
  for (let i = 0; i < courseNames.length; i++) {
    for (const period of periods) {
      const faculty = faker.helpers.arrayElement(faculties);
      const metadataId = await createMetadata("curso,demo");
      const course = await prismaClient.course.create({
        data: {
          name: courseNames[i],
          code: courseCodes[i],
          facultyId: faculty.id,
          periodId: period.id,
          credits: faker.helpers.arrayElement([3, 4, 5]),
          schedule: `${faker.helpers.arrayElement(["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"])} ${faker.helpers.arrayElement(["07:00-09:00", "09:00-11:00", "13:00-15:00", "15:00-17:00"])}`,
          classroom: `Aula ${faker.string.alpha({ length: 1, casing: "upper" })}${faker.string.numeric(3)}`,
          maxCapacity: faker.number.int({ min: 20, max: 50 }),
          metadataId,
        },
      });
      courses.push({
        id: course.id,
        facultyId: faculty.id,
        periodId: period.id,
      });
    }
  }
  console.log(`  ok ${courses.length} cursos creados`);

  // Course Instructors
  console.log("[DEMO] Asignando docentes a cursos...");
  const assignedPairs = new Set<string>();
  for (const course of courses) {
    const teacher = faker.helpers.arrayElement(teachers);
    const key = `${course.id}:${teacher.id}`;
    if (assignedPairs.has(key)) continue;
    assignedPairs.add(key);

    const metadataId = await createMetadata("asignacion,demo");
    await prismaClient.courseInstructor.create({
      data: {
        courseId: course.id,
        accountId: teacher.id,
        active: true,
        metadataId,
      },
    });
  }
  console.log("  ok Asignaciones docente-curso creadas");

  // Coordinators
  console.log("[DEMO] Creando coordinadores...");
  for (const faculty of faculties) {
    const pool = teachers.filter((t) => t.facultyId === faculty.id);
    if (pool.length === 0) continue;
    const teacher = faker.helpers.arrayElement(pool);

    const existing = await prismaClient.coordinator.findUnique({
      where: { accountId: teacher.id },
    });
    if (existing) continue;

    const metadataId = await createMetadata("coordinador,demo");
    await prismaClient.coordinator.create({
      data: {
        accountId: teacher.id,
        facultyId: faculty.id,
        active: true,
        metadataId,
      },
    });
    console.log(`  ok Coordinador asignado a facultad ${faculty.id}`);
  }

  // Enrollments & Grades
  console.log("[DEMO] Creando inscripciones y notas...");
  let enrollmentCount = 0;
  let gradeCount = 0;

  const activePeriod = periods.find((p) => p.active)!;
  const pastPeriods = periods.filter((p) => !p.active);

  for (const student of students.slice(0, 30)) {
    const shuffledCourses = faker.helpers
      .shuffle(courses.filter((c) => c.periodId === activePeriod.id))
      .slice(0, faker.number.int({ min: 3, max: 6 }));

    for (const course of shuffledCourses) {
      const enrollMetadataId = await createMetadata("inscripcion,demo");
      const enrollment = await prismaClient.enrollment.create({
        data: {
          accountId: student.id,
          courseId: course.id,
          periodId: activePeriod.id,
          status: "active",
          metadataId: enrollMetadataId,
        },
      });
      enrollmentCount++;

      const recorder = faker.helpers.arrayElement(teachers);
      const numGrades = faker.number.int({ min: 1, max: 3 });
      for (let g = 0; g < numGrades; g++) {
        const gradeMetadataId = await createMetadata("nota,demo");
        await prismaClient.grade.create({
          data: {
            enrollmentId: enrollment.id,
            description: gradeDescriptions[g],
            score: faker.number.float({ min: 40, max: 100, fractionDigits: 2 }),
            date: faker.date.recent({ days: 90 }),
            recordedById: recorder.id,
            metadataId: gradeMetadataId,
          },
        });
        gradeCount++;
      }
    }
  }

  for (const student of students.slice(0, 25)) {
    for (const period of pastPeriods) {
      const shuffledCourses = faker.helpers
        .shuffle(courses.filter((c) => c.periodId === period.id))
        .slice(0, faker.number.int({ min: 2, max: 5 }));

      for (const course of shuffledCourses) {
        const finalGrade = faker.number.float({
          min: 30,
          max: 100,
          fractionDigits: 2,
        });
        const status = finalGrade >= 60 ? "completed" : "failed";

        const enrollMetadataId = await createMetadata("inscripcion,demo");
        const enrollment = await prismaClient.enrollment.create({
          data: {
            accountId: student.id,
            courseId: course.id,
            periodId: period.id,
            status,
            finalGrade,
            metadataId: enrollMetadataId,
          },
        });
        enrollmentCount++;

        const recorder = faker.helpers.arrayElement(teachers);
        for (const desc of [
          "Primer Parcial",
          "Segundo Parcial",
          "Tercer Parcial",
          "Proyecto Final",
        ]) {
          const gradeMetadataId = await createMetadata("nota,demo");
          await prismaClient.grade.create({
            data: {
              enrollmentId: enrollment.id,
              description: desc,
              score: faker.number.float({
                min: 30,
                max: 100,
                fractionDigits: 2,
              }),
              date: faker.date.between({
                from: new Date("2025-01-01"),
                to: new Date("2025-11-30"),
              }),
              recordedById: recorder.id,
              metadataId: gradeMetadataId,
            },
          });
          gradeCount++;
        }
      }
    }
  }
  console.log(
    `  ok ${enrollmentCount} inscripciones y ${gradeCount} notas creadas`,
  );

  // Requests
  console.log("[DEMO] Creando solicitudes...");
  const requestStatuses: ("pending" | "approved" | "rejected" | "in_review")[] =
    ["pending", "pending", "approved", "approved", "rejected", "in_review"];

  for (let i = 0; i < 20; i++) {
    const student = faker.helpers.arrayElement(students);
    const faculty = faker.helpers.arrayElement(faculties);
    const status = faker.helpers.arrayElement(requestStatuses);
    const processor = faker.helpers.maybe(
      () => faker.helpers.arrayElement(teachers),
      { probability: 0.6 },
    );
    const metadataId = await createMetadata("solicitud,demo");

    await prismaClient.request.create({
      data: {
        accountId: student.id,
        facultyId: faculty.id,
        type: faker.helpers.arrayElement(requestTypes),
        description: faker.lorem.sentences(2),
        status,
        resolvedAt:
          status === "approved" || status === "rejected"
            ? faker.date.recent({ days: 30 })
            : null,
        response:
          status === "approved"
            ? "Su solicitud ha sido aprobada. Puede recoger el documento en ventanilla."
            : status === "rejected"
              ? "Su solicitud fue rechazada por no cumplir con los requisitos establecidos."
              : null,
        processedById: processor?.id ?? null,
        metadataId,
      },
    });
  }
  console.log("  ok 20 solicitudes creadas");

  // Logs (no metadata relation on this model)
  console.log("[DEMO] Generando logs del sistema...");
  const logLevels: (
    | "info"
    | "warning"
    | "error"
    | "critical"
    | "debug"
    | "important"
  )[] = ["info", "info", "info", "warning", "error", "debug"];
  const logSources = [
    "auth",
    "enrollment",
    "grades",
    "requests",
    "system",
    "api",
  ];

  for (let i = 0; i < 50; i++) {
    await prismaClient.log.create({
      data: {
        date: faker.date.recent({ days: 14 }),
        source: faker.helpers.arrayElement(logSources),
        level: faker.helpers.arrayElement(logLevels),
        message: faker.helpers.arrayElement([
          "Usuario autenticado exitosamente",
          "Intento de inicio de sesion fallido",
          "Inscripcion procesada",
          "Nota registrada",
          "Solicitud enviada",
          "Token de restablecimiento generado",
          "Sesion expirada",
          "Error al conectar con la base de datos",
          "Backup completado",
          "Tarea programada ejecutada",
        ]),
        duration:
          faker.helpers.maybe(() => faker.number.int({ min: 5, max: 2000 }), {
            probability: 0.7,
          }) ?? null,
        details: {
          ip: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
        },
        traceId: faker.string.uuid(),
      },
    });
  }
  console.log("  ok 50 logs generados");

  console.log("\n[DEMO] Carga de datos completada:");
  console.log(`  - ${Object.keys(roles).length} roles`);
  console.log(`  - ${campuses.length} campus`);
  console.log(`  - ${faculties.length} facultades`);
  console.log(`  - ${periods.length} periodos`);
  console.log(`  - ${teachers.length} docentes`);
  console.log(`  - ${students.length} estudiantes`);
  console.log(`  - ${courses.length} cursos`);
  console.log(`  - ${enrollmentCount} inscripciones`);
  console.log(`  - ${gradeCount} notas`);
  console.log("  - 20 solicitudes");
  console.log("  - 50 logs");
  console.log("\n[DEMO] Credenciales de prueba:");
  console.log("  Docentes -> email generado / docente123");
  console.log("  Estudiantes -> email generado / estudiante123");
};

export default demo;
