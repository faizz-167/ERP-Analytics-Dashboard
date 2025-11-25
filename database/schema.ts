import {
  pgTable,
  serial,
  text,
  integer,
  date,
  pgEnum,
  uniqueIndex,
  timestamp,
} from "drizzle-orm/pg-core";

// 1. Enums for Roles and Exam Types
export const roleEnum = pgEnum("role", ["admin", "teacher"]);
export const examEnum = pgEnum("exam_type", [
  "cat1",
  "cat2",
  "cat3",
  "semester",
]);
export const attendanceEnum = pgEnum("attendance_status", [
  "Present",
  "Absent",
]);
export const uploadStatusEnum = pgEnum("upload_status", ["uploaded", "failed"]);

// 2. Departments (e.g., CSE, ECE)
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // 'CSE', 'MECH'
});

// 3. Users (Teachers/Admins - Linked to Azure Entra ID via email)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // Matches Azure AD Email
  name: text("name"),
  role: roleEnum("role").default("teacher"),
  departmentId: integer("department_id").references(() => departments.id),
});

// 4. Subjects
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 'Data Structures'
  code: text("code").notNull(), // 'CS101'
  semester: integer("semester").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
});

// 5. Students
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  registerNumber: text("register_number").notNull().unique(),
  name: text("name").notNull(),
  departmentId: integer("department_id").references(() => departments.id),
});

// 6. Marks Table - Each row is a student with columns for different exams
export const marks = pgTable("marks", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id")
    .references(() => students.id)
    .notNull(),
  subjectId: integer("subject_id")
    .references(() => subjects.id)
    .notNull(),
  cat1: integer("cat1"), // Marks out of 50
  cat2: integer("cat2"), // Marks out of 50
  cat3: integer("cat3"), // Marks out of 50
  semester: integer("semester"), // Marks out of 100
});

// 7. Attendance Table - Each row is a student with columns for different dates
export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .references(() => students.id)
      .notNull(),
    subjectId: integer("subject_id")
      .references(() => subjects.id)
      .notNull(),
    attendanceDate: date("attendance_date").notNull(),
    status: attendanceEnum("status").notNull(),
  },
  (table) => ({
    attendanceUnique: uniqueIndex("attendance_unique_idx").on(
      table.studentId,
      table.subjectId,
      table.attendanceDate
    ),
  })
);

export const attendanceUploads = pgTable("attendance_uploads", {
  id: serial("id").primaryKey(),

  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),

  departmentId: integer("department_id")
    .references(() => departments.id)
    .notNull(),

  blobName: text("blob_name").notNull(), // e.g. teacher-email/timestamp-file.csv
  originalFileName: text("original_file_name").notNull(),

  status: uploadStatusEnum("status").default("uploaded").notNull(),

  error: text("error"), // optional, if something failed in future

  uploadedAt: timestamp("uploaded_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const teacherSubjects = pgTable(
  "teacher_subjects",
  {
    id: serial("id").primaryKey(),
    teacherId: integer("teacher_id")
      .references(() => users.id)
      .notNull(),
    subjectId: integer("subject_id")
      .references(() => subjects.id)
      .notNull(),
  },
  (table) => ({
    teacherSubjectUnique: uniqueIndex("teacher_subject_unique_idx").on(
      table.teacherId,
      table.subjectId
    ),
  })
);
