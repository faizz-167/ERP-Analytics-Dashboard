import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import db from "@/database/drizzle";
import { marks, students, subjects, attendance } from "@/database/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import AttendancePieChart from "@/components/AttendancePieChart";
import {
  ArrowLeft,
  BookOpen,
  TrendingUp,
  Calendar,
  Award,
  Target,
  BarChart3,
  User,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Activity,
} from "lucide-react";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.departmentId)
    return <div className="admin-container">Unauthorized</div>;

  // Await params in Next.js 15+
  const { id } = await params;
  const studentId = parseInt(id);

  const studentRes = await db
    .select()
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  const student = studentRes[0];

  if (!student) return <div className="admin-container">Student not found</div>;

  // Fetch marks with subject details
  const marksRecords = await db
    .select({
      subjectName: subjects.name,
      subjectCode: subjects.code,
      cat1: marks.cat1,
      cat2: marks.cat2,
      cat3: marks.cat3,
      semester: marks.semester,
    })
    .from(marks)
    .leftJoin(subjects, eq(marks.subjectId, subjects.id))
    .where(eq(marks.studentId, studentId));

  // Fetch attendance records
  const attendanceRecords = await db
    .select()
    .from(attendance)
    .where(eq(attendance.studentId, studentId));

  // Transform marks data by subject
  const subjectMarks = marksRecords.map((record) => {
    const cat1 = record.cat1 ?? null;
    const cat2 = record.cat2 ?? null;
    const cat3 = record.cat3 ?? null;
    const semester = record.semester ?? null;

    // Calculate total marks (cat1+cat2+cat3 out of 150, semester out of 100)
    let totalMarks = 0;
    let totalMax = 0;

    if (cat1 !== null) {
      totalMarks += cat1;
      totalMax += 50;
    }
    if (cat2 !== null) {
      totalMarks += cat2;
      totalMax += 50;
    }
    if (cat3 !== null) {
      totalMarks += cat3;
      totalMax += 50;
    }
    if (semester !== null) {
      totalMarks += semester;
      totalMax += 100;
    }

    const percentage = totalMax > 0 ? (totalMarks / totalMax) * 100 : 0;

    return {
      subject: record.subjectName || "Unknown",
      code: record.subjectCode || "",
      cat1,
      cat2,
      cat3,
      semester,
      totalMarks,
      totalMax,
      percentage: percentage.toFixed(1),
    };
  });

  // Calculate statistics
  const totalExams = subjectMarks.reduce((sum, s) => {
    let count = 0;
    if (s.cat1 !== null) count++;
    if (s.cat2 !== null) count++;
    if (s.cat3 !== null) count++;
    if (s.semester !== null) count++;
    return sum + count;
  }, 0);

  const avgMarks =
    subjectMarks.length > 0
      ? (
          subjectMarks.reduce((sum, s) => sum + parseFloat(s.percentage), 0) /
          subjectMarks.length
        ).toFixed(1)
      : "0";

  const totalClasses = attendanceRecords.length;
  const attendedClasses = attendanceRecords.filter(
    (a) => a.status === "Present"
  ).length;
  const absentClasses = totalClasses - attendedClasses;
  const attendanceRate =
    totalClasses > 0
      ? ((attendedClasses / totalClasses) * 100).toFixed(0)
      : "0";

  const getGradeColor = (percentage: string) => {
    const perc = parseFloat(percentage);
    if (perc >= 90)
      return "bg-linear-to-br from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-300";
    if (perc >= 75)
      return "bg-linear-to-br from-blue-100 to-blue-50 text-blue-700 border-blue-300";
    if (perc >= 60)
      return "bg-linear-to-br from-amber-100 to-amber-50 text-amber-700 border-amber-300";
    if (perc >= 50)
      return "bg-linear-to-br from-orange-100 to-orange-50 text-orange-700 border-orange-300";
    return "bg-linear-to-br from-red-100 to-red-50 text-red-700 border-red-300";
  };

  const getPerformanceBadge = (avg: string) => {
    const percentage = parseFloat(avg);
    if (percentage === 0)
      return {
        label: "No Data",
        color: "bg-gray-100 text-gray-700",
        icon: AlertCircle,
      };
    if (percentage >= 90)
      return {
        label: "Outstanding",
        color:
          "bg-linear-to-br from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-300",
        icon: Trophy,
      };
    if (percentage >= 75)
      return {
        label: "Excellent",
        color:
          "bg-linear-to-br from-blue-100 to-blue-50 text-blue-700 border-blue-300",
        icon: Award,
      };
    if (percentage >= 60)
      return {
        label: "Good",
        color:
          "bg-linear-to-br from-amber-100 to-amber-50 text-amber-700 border-amber-300",
        icon: CheckCircle2,
      };
    if (percentage >= 50)
      return {
        label: "Average",
        color:
          "bg-linear-to-br from-orange-100 to-orange-50 text-orange-700 border-orange-300",
        icon: TrendingUp,
      };
    return {
      label: "Needs Improvement",
      color:
        "bg-linear-to-br from-red-100 to-red-50 text-red-700 border-red-300",
      icon: AlertCircle,
    };
  };

  const performanceBadge = getPerformanceBadge(avgMarks);
  const PerformanceIcon = performanceBadge.icon;

  return (
    <section className="w-full pb-8">
      {/* Header with gradient background */}
      <div className="relative mb-8 -mx-6 -mt-6 px-6 pt-6 pb-8 bg-linear-to-br from-blue-50 via-indigo-50 to-transparent border-b border-blue-100">
        <div className="flex items-start justify-between gap-4 mb-6">
          <Link href="/students">
            <Button
              variant="outline"
              className="gap-2 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 transition-all duration-300 font-semibold shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Students
            </Button>
          </Link>
        </div>

        {/* Student Profile */}
        <div className="flex items-start gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-xl ring-2 ring-blue-200">
              <AvatarFallback className="bg-linear-to-br from-blue-500 to-blue-600 text-white text-3xl font-bold">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-lg border-2 border-blue-200">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {student.name}
            </h1>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-blue-200 shadow-sm">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="font-mono font-semibold text-gray-900">
                  {student.registerNumber}
                </span>
              </div>
              <Badge
                className={`${performanceBadge.color} border px-3 py-1.5 font-semibold text-sm flex items-center gap-2`}
              >
                <PerformanceIcon className="w-4 h-4" />
                {performanceBadge.label}
              </Badge>
            </div>
            <p className="text-gray-600 text-base">
              Complete academic performance and attendance overview
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Total Exams
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {totalExams}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">
              Across all subjects
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Average Score
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              {avgMarks}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-gray-600 font-medium">
                Overall performance
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-purple-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Attendance Rate
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-purple-600 to-purple-500 bg-clip-text text-transparent">
              {attendanceRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600 font-medium">
                {attendedClasses} of {totalClasses} classes
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Academic Performance Table */}
        <Card className="xl:col-span-3 border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl font-bold">
                  Academic Performance
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Subject-wise marks breakdown across all exams
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-linear-to-r from-gray-100 to-gray-50">
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left font-bold text-gray-900 min-w-[200px]">
                      Subject
                    </th>
                    <th className="px-4 py-4 text-center font-bold text-gray-900 w-24">
                      CAT 1
                    </th>
                    <th className="px-4 py-4 text-center font-bold text-gray-900 w-24">
                      CAT 2
                    </th>
                    <th className="px-4 py-4 text-center font-bold text-gray-900 w-24">
                      CAT 3
                    </th>
                    <th className="px-4 py-4 text-center font-bold text-gray-900 w-28">
                      Semester
                    </th>
                    <th className="px-4 py-4 text-center font-bold text-gray-900 w-28">
                      Total
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-gray-900 w-32">
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subjectMarks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <Activity className="w-10 h-10 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-gray-700 mb-1">
                              No exam records found
                            </p>
                            <p className="text-gray-500">
                              Exam results will appear here once available
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    subjectMarks.map((subject, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <BookOpen className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-base text-gray-900">
                                {subject.subject}
                              </div>
                              <div className="text-xs text-gray-500 font-mono mt-0.5">
                                {subject.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-lg text-gray-900">
                              {subject.cat1 !== null ? subject.cat1 : "-"}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              /50
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-lg text-gray-900">
                              {subject.cat2 !== null ? subject.cat2 : "-"}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              /50
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-lg text-gray-900">
                              {subject.cat3 !== null ? subject.cat3 : "-"}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              /50
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-lg text-gray-900">
                              {subject.semester !== null
                                ? subject.semester
                                : "-"}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              /100
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-xl bg-linear-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {subject.totalMarks}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              /{subject.totalMax}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge
                            variant="outline"
                            className={`${getGradeColor(
                              subject.percentage
                            )} px-4 py-2 font-bold text-sm border`}
                          >
                            {subject.percentage}%
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            {subjectMarks.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600 text-center">
                  Showing{" "}
                  <span className="font-bold text-gray-900">
                    {subjectMarks.length}
                  </span>{" "}
                  subject
                  {subjectMarks.length !== 1 ? "s" : ""} with{" "}
                  <span className="font-bold text-gray-900">{totalExams}</span>{" "}
                  total exam
                  {totalExams !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Overview */}
        <Card className="xl:col-span-1 border-2 border-gray-200 shadow-lg">
          <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl font-bold">Attendance</CardTitle>
                <CardDescription className="text-sm mt-1">
                  Visual breakdown
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <AttendancePieChart
              present={attendedClasses}
              absent={absentClasses}
              total={totalClasses}
            />

            {/* Additional Stats */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 bg-linear-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900">
                    Present
                  </span>
                </div>
                <span className="text-lg font-bold text-emerald-700">
                  {attendedClasses}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-linear-to-br from-red-50 to-red-100 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-900">
                    Absent
                  </span>
                </div>
                <span className="text-lg font-bold text-red-700">
                  {absentClasses}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
