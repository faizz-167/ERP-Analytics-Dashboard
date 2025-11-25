import { auth } from "@/auth";
import db from "@/database/drizzle";
import { students, marks, attendance, departments } from "@/database/schema";
import { eq, sql } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DepartmentCharts from "@/components/DepartmentCharts";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  TrendingUp,
  Calendar,
  Award,
  BarChart3,
  Building2,
  CheckCircle2,
  AlertCircle,
  Target,
  ArrowUpRight,
  Activity,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.departmentId) {
    return <div className="admin-container">Unauthorized</div>;
  }

  const departmentId = session.user.departmentId;
  const isTeacher = session.user.role === "teacher";

  // Fetch department info
  const dept = await db
    .select()
    .from(departments)
    .where(eq(departments.id, departmentId))
    .limit(1);

  const departmentName = dept[0]?.name || "Department";

  // Fetch all students in department
  const allStudents = await db
    .select()
    .from(students)
    .where(eq(students.departmentId, departmentId));

  const totalStudents = allStudents.length;

  // Fetch all marks for department students
  const allMarks = await db
    .select({
      studentId: marks.studentId,
      cat1: marks.cat1,
      cat2: marks.cat2,
      cat3: marks.cat3,
      semester: marks.semester,
    })
    .from(marks)
    .where(
      sql`${marks.studentId} IN (${sql.join(
        allStudents.map((s) => s.id),
        sql`, `
      )})`
    );

  // Calculate department average
  let totalExams = 0;
  let totalPercentage = 0;

  allMarks.forEach((mark) => {
    if (mark.cat1 !== null) {
      totalExams++;
      totalPercentage += (mark.cat1 / 50) * 100;
    }
    if (mark.cat2 !== null) {
      totalExams++;
      totalPercentage += (mark.cat2 / 50) * 100;
    }
    if (mark.cat3 !== null) {
      totalExams++;
      totalPercentage += (mark.cat3 / 50) * 100;
    }
    if (mark.semester !== null) {
      totalExams++;
      totalPercentage += (mark.semester / 100) * 100;
    }
  });

  const departmentAverage =
    totalExams > 0 ? (totalPercentage / totalExams).toFixed(1) : "0";

  // Calculate performance distribution
  const studentPerformances = allStudents.map((student) => {
    const studentMarks = allMarks.filter((m) => m.studentId === student.id);
    let examCount = 0;
    let totalPerc = 0;

    studentMarks.forEach((mark) => {
      if (mark.cat1 !== null) {
        examCount++;
        totalPerc += (mark.cat1 / 50) * 100;
      }
      if (mark.cat2 !== null) {
        examCount++;
        totalPerc += (mark.cat2 / 50) * 100;
      }
      if (mark.cat3 !== null) {
        examCount++;
        totalPerc += (mark.cat3 / 50) * 100;
      }
      if (mark.semester !== null) {
        examCount++;
        totalPerc += (mark.semester / 100) * 100;
      }
    });

    return examCount > 0 ? totalPerc / examCount : 0;
  });

  const excellent = studentPerformances.filter((p) => p >= 90).length;
  const good = studentPerformances.filter((p) => p >= 75 && p < 90).length;
  const average = studentPerformances.filter((p) => p >= 60 && p < 75).length;
  const needsImprovement = studentPerformances.filter(
    (p) => p < 60 && p > 0
  ).length;

  // Fetch all attendance records
  const allAttendance = await db
    .select()
    .from(attendance)
    .where(
      sql`${attendance.studentId} IN (${sql.join(
        allStudents.map((s) => s.id),
        sql`, `
      )})`
    );

  const totalClasses = allAttendance.length;
  const presentClasses = allAttendance.filter(
    (a) => a.status === "Present"
  ).length;
  const absentClasses = totalClasses - presentClasses;
  const attendanceRate =
    totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(1) : "0";

  // Get active students (those with at least one exam)
  const activeStudents = allStudents.filter((student) =>
    allMarks.some((m) => m.studentId === student.id)
  ).length;

  // Calculate exam-wise averages
  const cat1Marks = allMarks.filter((m) => m.cat1 !== null);
  const cat2Marks = allMarks.filter((m) => m.cat2 !== null);
  const cat3Marks = allMarks.filter((m) => m.cat3 !== null);
  const semMarks = allMarks.filter((m) => m.semester !== null);

  const cat1Avg =
    cat1Marks.length > 0
      ? (
          (cat1Marks.reduce((sum, m) => sum + (m.cat1 || 0), 0) /
            cat1Marks.length /
            50) *
          100
        ).toFixed(1)
      : "0";
  const cat2Avg =
    cat2Marks.length > 0
      ? (
          (cat2Marks.reduce((sum, m) => sum + (m.cat2 || 0), 0) /
            cat2Marks.length /
            50) *
          100
        ).toFixed(1)
      : "0";
  const cat3Avg =
    cat3Marks.length > 0
      ? (
          (cat3Marks.reduce((sum, m) => sum + (m.cat3 || 0), 0) /
            cat3Marks.length /
            50) *
          100
        ).toFixed(1)
      : "0";
  const semAvg =
    semMarks.length > 0
      ? (
          semMarks.reduce((sum, m) => sum + (m.semester || 0), 0) /
          semMarks.length
        ).toFixed(1)
      : "0";

  const examData = [
    { name: "CAT 1", average: parseFloat(cat1Avg), count: cat1Marks.length },
    { name: "CAT 2", average: parseFloat(cat2Avg), count: cat2Marks.length },
    { name: "CAT 3", average: parseFloat(cat3Avg), count: cat3Marks.length },
    { name: "Semester", average: parseFloat(semAvg), count: semMarks.length },
  ];

  const performanceData = [
    { name: "Excellent (90%+)", value: excellent, color: "#22c55e" },
    { name: "Good (75-89%)", value: good, color: "#3b82f6" },
    { name: "Average (60-74%)", value: average, color: "#f59e0b" },
    { name: "Needs Improvement", value: needsImprovement, color: "#ef4444" },
  ];

  const attendanceData = [
    { name: "Present", value: presentClasses, color: "#22c55e" },
    { name: "Absent", value: absentClasses, color: "#ef4444" },
  ];

  return (
    <section className="w-full pb-8">
      {/* Hero Header */}
      <div className="relative mb-8 -mx-6 -mt-6 px-6 pt-8 pb-12 bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-start gap-5 flex-1">
            <div className="p-4 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-5xl font-black text-white tracking-tight">
                  {departmentName}
                </h1>
                <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Dashboard
                  </span>
                </div>
              </div>
              <p className="text-blue-100 text-lg font-medium">
                Real-time analytics and performance insights
              </p>
            </div>
          </div>

          {isTeacher && (
            <Button
              className="bg-white text-blue-900 hover:bg-blue-50 font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link
                href="/attendance-upload"
                className="flex items-center gap-2 px-6 py-6"
              >
                <Plus className="w-5 h-5" />
                Upload Data
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 auto-rows-fr">
        {/* Total Students - Large Card */}
        <Card className="lg:col-span-2 lg:row-span-2 group relative overflow-hidden border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-linear-to-br from-blue-50 via-white to-blue-50/30">
          <div className="absolute inset-0 bg-linear-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />

          <CardHeader className="pb-4 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="p-4 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <Link href="/students">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-blue-100"
                >
                  <ArrowUpRight className="w-5 h-5 text-blue-600" />
                </Button>
              </Link>
            </div>
            <CardDescription className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Total Students
            </CardDescription>
            <CardTitle className="text-7xl font-black bg-linear-to-br from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
              {totalStudents}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Active Students
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {activeStudents}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">
                    {totalStudents > 0
                      ? ((activeStudents / totalStudents) * 100).toFixed(0)
                      : 0}
                    %
                  </p>
                  <p className="text-xs text-gray-500">of total</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-linear-to-br from-blue-100 to-blue-50 rounded-xl border border-blue-200">
                  <p className="text-xs font-medium text-blue-700 mb-1">
                    Enrolled
                  </p>
                  <p className="text-xl font-bold text-blue-900">
                    {totalStudents}
                  </p>
                </div>
                <div className="p-3 bg-linear-to-br from-purple-100 to-purple-50 rounded-xl border border-purple-200">
                  <p className="text-xs font-medium text-purple-700 mb-1">
                    With Records
                  </p>
                  <p className="text-xl font-bold text-purple-900">
                    {activeStudents}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department Average - Tall Card */}
        <Card className="lg:row-span-2 group relative overflow-hidden border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-linear-to-br from-emerald-50 via-white to-emerald-50/30">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-200 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity" />

          <CardHeader className="pb-4 relative">
            <div className="p-4 bg-linear-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <CardDescription className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Department Average
            </CardDescription>
            <CardTitle className="text-6xl font-black bg-linear-to-br from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {departmentAverage}%
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-emerald-200">
                <Target className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-gray-700">
                  Overall Performance
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>Progress</span>
                  <span>{departmentAverage}%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${departmentAverage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <div className="text-center p-2 bg-emerald-100 rounded-lg">
                  <p className="text-xs text-emerald-700 font-medium">Target</p>
                  <p className="text-lg font-bold text-emerald-900">85%</p>
                </div>
                <div className="text-center p-2 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">Current</p>
                  <p className="text-lg font-bold text-blue-900">
                    {departmentAverage}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Rate - Medium Card */}
        <Card className="lg:row-span-1 group relative overflow-hidden border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-linear-to-br from-purple-50 via-white to-purple-50/30">
          <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <CardHeader className="pb-3 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-linear-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardDescription className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Attendance Rate
            </CardDescription>
            <CardTitle className="text-5xl font-black bg-linear-to-br from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {attendanceRate}%
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex items-center justify-between p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-700">
                  {presentClasses} / {totalClasses}
                </span>
              </div>
              <span className="text-xs font-semibold text-purple-600">
                classes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers - Medium Card */}
        <Card className="lg:row-span-1 group relative overflow-hidden border-2 border-amber-200 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] bg-linear-to-br from-amber-50 via-white to-amber-50/30">
          <div className="absolute inset-0 bg-linear-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <CardHeader className="pb-3 relative">
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 bg-linear-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardDescription className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              Top Performers
            </CardDescription>
            <CardTitle className="text-5xl font-black bg-linear-to-br from-amber-600 to-orange-600 bg-clip-text text-transparent">
              {excellent}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-amber-200">
              <p className="text-xs font-semibold text-amber-700">
                90% and above
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {totalStudents > 0
                  ? ((excellent / totalStudents) * 100).toFixed(0)
                  : 0}
                % of total students
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Distribution - Bento Grid */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6 px-1">
          <div className="p-3 bg-linear-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Performance Distribution
            </h2>
            <p className="text-gray-600 font-medium">
              Student performance across different ranges
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Excellent */}
          <Card className="group relative overflow-hidden border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-linear-to-br from-emerald-50 to-white">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <CardHeader className="pb-3 relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-emerald-500 rounded-lg shadow-md">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <CardDescription className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  Excellent
                </CardDescription>
              </div>
              <CardTitle className="text-5xl font-black text-emerald-600 mb-2">
                {excellent}
              </CardTitle>
              <Badge className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white border-0 font-bold text-xs px-3 py-1">
                90%+ •{" "}
                {totalStudents > 0
                  ? ((excellent / totalStudents) * 100).toFixed(0)
                  : 0}
                % of students
              </Badge>
            </CardHeader>
          </Card>

          {/* Good */}
          <Card className="group relative overflow-hidden border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-linear-to-br from-blue-50 to-white">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <CardHeader className="pb-3 relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg shadow-md">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <CardDescription className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                  Good
                </CardDescription>
              </div>
              <CardTitle className="text-5xl font-black text-blue-600 mb-2">
                {good}
              </CardTitle>
              <Badge className="bg-linear-to-br from-blue-500 to-blue-600 text-white border-0 font-bold text-xs px-3 py-1">
                75-89% •{" "}
                {totalStudents > 0
                  ? ((good / totalStudents) * 100).toFixed(0)
                  : 0}
                % of students
              </Badge>
            </CardHeader>
          </Card>

          {/* Average */}
          <Card className="group relative overflow-hidden border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-linear-to-br from-amber-50 to-white">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <CardHeader className="pb-3 relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-amber-500 rounded-lg shadow-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <CardDescription className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  Average
                </CardDescription>
              </div>
              <CardTitle className="text-5xl font-black text-amber-600 mb-2">
                {average}
              </CardTitle>
              <Badge className="bg-linear-to-br from-amber-500 to-amber-600 text-white border-0 font-bold text-xs px-3 py-1">
                60-74% •{" "}
                {totalStudents > 0
                  ? ((average / totalStudents) * 100).toFixed(0)
                  : 0}
                % of students
              </Badge>
            </CardHeader>
          </Card>

          {/* Needs Improvement */}
          <Card className="group relative overflow-hidden border-2 border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-linear-to-br from-red-50 to-white">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-200 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity" />
            <CardHeader className="pb-3 relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 bg-red-500 rounded-lg shadow-md">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <CardDescription className="text-xs font-bold text-red-700 uppercase tracking-wide">
                  Needs Work
                </CardDescription>
              </div>
              <CardTitle className="text-5xl font-black text-red-600 mb-2">
                {needsImprovement}
              </CardTitle>
              <Badge className="bg-linear-to-br from-red-500 to-red-600 text-white border-0 font-bold text-xs px-3 py-1">
                Below 60% •{" "}
                {totalStudents > 0
                  ? ((needsImprovement / totalStudents) * 100).toFixed(0)
                  : 0}
                % of students
              </Badge>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Charts Section */}
      <DepartmentCharts
        examData={examData}
        performanceData={performanceData}
        attendanceData={attendanceData}
      />
    </section>
  );
}
