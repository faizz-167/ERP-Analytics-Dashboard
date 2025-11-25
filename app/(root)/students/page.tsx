import { auth } from "@/auth";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import db from "@/database/drizzle";
import { students, marks } from "@/database/schema";
import { sql } from "drizzle-orm";
import Search from "@/components/Search";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  UserCheck,
  Award,
  ChevronRight,
  BookOpen,
  BarChart3,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
} from "lucide-react";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.departmentId)
    return <div className="admin-container">Unauthorized</div>;

  // Get search query - await searchParams in Next.js 15+
  const params = await searchParams;
  const query = params.query?.toLowerCase() || "";

  // Fetch students with their marks count
  const studentList = await db
    .select({
      id: students.id,
      registerNumber: students.registerNumber,
      name: students.name,
      departmentId: students.departmentId,
    })
    .from(students)
    .where(eq(students.departmentId, session.user.departmentId));

  // Filter students based on search query
  const filteredStudents = studentList.filter((student) => {
    if (!query) return true;

    const nameMatch = student.name.toLowerCase().includes(query);
    const registerMatch = student.registerNumber.toLowerCase().includes(query);

    return nameMatch || registerMatch;
  });

  // Fetch marks data for filtered students
  const marksData =
    filteredStudents.length > 0
      ? await db
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
              filteredStudents.map((s) => s.id),
              sql`, `
            )})`
          )
      : [];

  // Calculate statistics for each student
  const studentsWithStats = filteredStudents.map((student) => {
    const studentMarks = marksData.filter((m) => m.studentId === student.id);

    let totalExams = 0;
    let totalPercentage = 0;

    studentMarks.forEach((mark) => {
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

    const avgPercentage = totalExams > 0 ? totalPercentage / totalExams : 0;

    return {
      ...student,
      totalExams,
      avgPercentage: avgPercentage.toFixed(1),
    };
  });

  const totalStudents = studentList.length;
  const studentsWithData = studentsWithStats.filter(
    (s) => s.totalExams > 0
  ).length;
  const overallAvg =
    studentsWithStats.length > 0
      ? (
          studentsWithStats.reduce(
            (sum, s) => sum + parseFloat(s.avgPercentage),
            0
          ) / studentsWithStats.length
        ).toFixed(1)
      : "0";

  // Calculate performance distribution
  const excellentCount = studentsWithStats.filter(
    (s) => parseFloat(s.avgPercentage) >= 75
  ).length;

  const getPerformanceBadge = (avg: string) => {
    const percentage = parseFloat(avg);
    if (percentage === 0)
      return {
        label: "No Data",
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-700 border-gray-300",
        icon: AlertCircle,
      };
    if (percentage >= 75)
      return {
        label: "Excellent",
        variant: "outline" as const,
        color:
          "bg-linear-to-br from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-300",
        icon: Award,
      };
    if (percentage >= 60)
      return {
        label: "Good",
        variant: "secondary" as const,
        color:
          "bg-linear-to-br from-blue-100 to-blue-50 text-blue-700 border-blue-300",
        icon: CheckCircle2,
      };
    if (percentage >= 50)
      return {
        label: "Average",
        variant: "outline" as const,
        color:
          "bg-linear-to-br from-amber-100 to-amber-50 text-amber-700 border-amber-300",
        icon: TrendingUp,
      };
    return {
      label: "Needs Improvement",
      variant: "destructive" as const,
      color:
        "bg-linear-to-br from-red-100 to-red-50 text-red-700 border-red-300",
      icon: TrendingDown,
    };
  };

  return (
    <section className="w-full pb-8">
      {/* Header with gradient background */}
      <div className="relative mb-8 -mx-6 -mt-6 px-6 pt-6 pb-8 bg-linear-to-br from-blue-50 via-indigo-50 to-transparent border-b border-blue-100">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-md border border-blue-200">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Students Directory
            </h2>
            <p className="text-gray-600 text-lg">
              Manage and view all students in your department
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="relative overflow-hidden border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Total Students
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {totalStudents}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">
              Enrolled in department
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-emerald-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Active Students
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              {studentsWithData}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">
              With exam records
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-purple-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Department Average
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-purple-600 to-purple-500 bg-clip-text text-transparent">
              {overallAvg}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-amber-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Top Performers
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-amber-600 to-amber-500 bg-clip-text text-transparent">
              {excellentCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">75% and above</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Search />
      </div>

      {/* Students Table */}
      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-bold">All Students</CardTitle>
              <CardDescription className="text-base mt-1">
                {query ? (
                  <>
                    Showing {studentsWithStats.length} result
                    {studentsWithStats.length !== 1 ? "s" : ""} for &quot;
                    {query}&quot;
                  </>
                ) : (
                  "Click on any student to view detailed performance"
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {studentsWithStats.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {query
                  ? `No students found matching "${query}"`
                  : "No students found"}
              </p>
              <p className="text-gray-500">
                {query
                  ? "Try a different search term"
                  : "Students will appear here once enrolled"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-linear-to-r from-gray-100 to-gray-50">
                  <tr className="border-b-2 border-gray-200">
                    <th className="px-6 py-4 text-left font-bold text-gray-900 text-sm">
                      Register Number
                    </th>
                    <th className="px-6 py-4 text-left font-bold text-gray-900 text-sm">
                      Student Name
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-gray-900 text-sm">
                      Exams Taken
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-gray-900 text-sm">
                      Average Score
                    </th>
                    <th className="px-6 py-4 text-center font-bold text-gray-900 text-sm">
                      Performance
                    </th>
                    <th className="px-6 py-4 text-right font-bold text-gray-900 text-sm pr-6">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {studentsWithStats.map((student) => {
                    const badge = getPerformanceBadge(student.avgPercentage);
                    const BadgeIcon = badge.icon;

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors group"
                      >
                        {/* Register Number */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-gray-100 rounded group-hover:bg-blue-100 transition-colors">
                              <BookOpen className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-600" />
                            </div>
                            <span className="font-mono font-bold text-gray-900">
                              {student.registerNumber}
                            </span>
                          </div>
                        </td>

                        {/* Name + Avatar */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-blue-200 shadow-sm">
                              <AvatarFallback className="bg-linear-to-br from-blue-500 to-blue-600 text-white font-bold">
                                {getInitials(student.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {student.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: #{student.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Exams */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-200 rounded-full">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-bold text-blue-700">
                              {student.totalExams}
                            </span>
                          </div>
                        </td>

                        {/* Average */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-2xl font-bold bg-linear-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {student.avgPercentage}%
                            </span>
                          </div>
                        </td>

                        {/* Performance */}
                        <td className="px-6 py-4 text-center">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${badge.color} font-semibold text-xs`}
                          >
                            <BadgeIcon className="w-3.5 h-3.5" />
                            {badge.label}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-right pr-6">
                          <Link href={`/students/${student.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 hover:bg-blue-100 hover:text-blue-700 font-semibold transition-all group/button"
                            >
                              View Details
                              <ChevronRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer with count */}
          {studentsWithStats.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Displaying{" "}
                <span className="font-bold text-gray-900">
                  {studentsWithStats.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-900">{totalStudents}</span>{" "}
                total students
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
