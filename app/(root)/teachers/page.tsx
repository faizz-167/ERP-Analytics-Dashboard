import { auth } from "@/auth";
import { and, eq } from "drizzle-orm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import db from "@/database/drizzle";
import { users, subjects, teacherSubjects } from "@/database/schema";
import AssignTeacherPanel from "@/components/AssignTeacherPanel";
import {
  Users,
  BookOpen,
  GraduationCap,
  Mail,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default async function TeachersPage() {
  const session = await auth();
  if (!session?.user?.departmentId)
    return <div className="admin-container">Unauthorized</div>;

  const departmentId = session.user.departmentId;
  const isAdmin = session.user.role === "admin";

  // 1. All teachers in this department
  const teacherList = await db
    .select()
    .from(users)
    .where(
      and(eq(users.role, "teacher"), eq(users.departmentId, departmentId))
    );

  // 2. Subjects in this department + assigned teacher (if any)
  const subjectList = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      semester: subjects.semester,
      assignedTeacherId: teacherSubjects.teacherId,
      assignedTeacherName: users.name,
    })
    .from(subjects)
    .leftJoin(teacherSubjects, eq(teacherSubjects.subjectId, subjects.id))
    .leftJoin(users, eq(teacherSubjects.teacherId, users.id))
    .where(eq(subjects.departmentId, departmentId));

  // Calculate statistics
  const totalTeachers = teacherList.length;
  const assignedSubjects = subjectList.filter(
    (s) => s.assignedTeacherId
  ).length;
  const unassignedSubjects = subjectList.length - assignedSubjects;

  // Calculate teacher workload
  const teacherWorkload = teacherList.map((teacher) => {
    const assignedCount = subjectList.filter(
      (s) => s.assignedTeacherId === teacher.id
    ).length;
    return {
      ...teacher,
      subjectCount: assignedCount,
    };
  });

  return (
    <section className="w-full pb-8">
      {/* Header with gradient background */}
      <div className="relative mb-8 -mx-6 -mt-6 px-6 pt-6 pb-8 bg-linear-to-br from-purple-50 via-blue-50 to-transparent border-b border-purple-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-md border border-purple-200">
            <Users className="w-8 h-8 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Faculty Members
            </h2>
            <p className="text-gray-600 text-lg">
              View all faculty in your department and manage their subject
              allocations
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-purple-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Total Faculty
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-purple-600 to-purple-500 bg-clip-text text-transparent">
              {totalTeachers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">Active members</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Assigned Subjects
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              {assignedSubjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">
              With faculty assigned
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-amber-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-amber-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Unassigned
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-amber-600 to-amber-500 bg-clip-text text-transparent">
              {unassignedSubjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">
              Subjects pending
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Avg Workload
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {totalTeachers > 0
                ? (assignedSubjects / totalTeachers).toFixed(1)
                : 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">
              Subjects per faculty
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Layout: table + assignment panel */}
      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1.2fr] gap-6 items-start">
        {/* Teachers Table */}
        <Card className="border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">Faculty Directory</CardTitle>
                <CardDescription className="text-base">
                  Complete list of all department faculty members
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {teacherList.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  No faculty members found
                </p>
                <p className="text-gray-500">
                  Faculty members will appear here once added to the system
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-linear-to-r from-gray-100 to-gray-50">
                    <TableRow className="border-b-2 border-gray-200">
                      <TableHead className="font-bold text-gray-900 text-sm">
                        Faculty Member
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm">
                        Contact
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm">
                        Subjects
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherWorkload.map((t) => (
                      <TableRow
                        key={t.id}
                        className="hover:bg-purple-50/50 transition-colors border-b border-gray-100"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3 py-2">
                            <div className="relative">
                              <div className="size-10 rounded-full bg-linear-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                                {t.name?.charAt(0).toUpperCase() ?? "T"}
                              </div>
                              {t.subjectCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-white">
                                    {t.subjectCount}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {t.name ?? "Unnamed Teacher"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Faculty ID: #{t.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{t.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-gray-900">
                              {t.subjectCount}
                            </span>
                            <span className="text-sm text-gray-500">
                              {t.subjectCount === 1 ? "subject" : "subjects"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-linear-to-r from-emerald-100 to-emerald-50 border border-emerald-200 rounded-full">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-emerald-700 text-xs font-bold">
                                Active
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign teachers to subjects – admin only */}
        {isAdmin && (
          <div className="sticky top-6">
            <AssignTeacherPanel
              subjects={subjectList.map((s) => ({
                id: s.id,
                name: s.name,
                code: s.code,
                semester: s.semester,
                assignedTeacherId: s.assignedTeacherId ?? null,
                assignedTeacherName: s.assignedTeacherName ?? null,
              }))}
              teachers={teacherList.map((t) => ({
                id: t.id,
                name: t.name ?? t.email ?? "Unnamed",
                email: t.email ?? "",
              }))}
            />
          </div>
        )}
      </div>
    </section>
  );
}
