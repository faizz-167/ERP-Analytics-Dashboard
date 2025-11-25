import { auth } from "@/auth";
import { eq, sql } from "drizzle-orm";
import db from "@/database/drizzle";
import { marks, subjects } from "@/database/schema";
import SubjectChart from "@/components/SubjectChart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubjectAdminPanel from "@/components/SubjectAdminPanel";
import {
  BookOpen,
  TrendingUp,
  Users,
  Award,
  BarChart3,
  Activity,
} from "lucide-react";

export default async function SubjectsPage() {
  const session = await auth();
  if (!session?.user?.departmentId)
    return <div className="admin-container">Unauthorized</div>;

  const subjectList = await db
    .select()
    .from(subjects)
    .where(eq(subjects.departmentId, session.user.departmentId));

  // Get all marks for the department's subjects
  const marksData = await db
    .select({
      subjectId: marks.subjectId,
      cat1: marks.cat1,
      cat2: marks.cat2,
      cat3: marks.cat3,
      semester: marks.semester,
    })
    .from(marks)
    .where(
      sql`${marks.subjectId} IN (${sql.join(
        subjectList.map((s) => s.id),
        sql`, `
      )})`
    );

  // Calculate detailed statistics for each subject
  const subjectsWithStats = subjectList.map((subject) => {
    const subjectMarks = marksData.filter((m) => m.subjectId === subject.id);

    let cat1Total = 0,
      cat1Count = 0;
    let cat2Total = 0,
      cat2Count = 0;
    let cat3Total = 0,
      cat3Count = 0;
    let semTotal = 0,
      semCount = 0;
    let overallTotal = 0,
      overallCount = 0;

    subjectMarks.forEach((mark) => {
      if (mark.cat1 !== null) {
        cat1Total += (mark.cat1 / 50) * 100;
        cat1Count++;
        overallTotal += (mark.cat1 / 50) * 100;
        overallCount++;
      }
      if (mark.cat2 !== null) {
        cat2Total += (mark.cat2 / 50) * 100;
        cat2Count++;
        overallTotal += (mark.cat2 / 50) * 100;
        overallCount++;
      }
      if (mark.cat3 !== null) {
        cat3Total += (mark.cat3 / 50) * 100;
        cat3Count++;
        overallTotal += (mark.cat3 / 50) * 100;
        overallCount++;
      }
      if (mark.semester !== null) {
        semTotal += (mark.semester / 100) * 100;
        semCount++;
        overallTotal += (mark.semester / 100) * 100;
        overallCount++;
      }
    });

    return {
      ...subject,
      cat1Avg: cat1Count > 0 ? (cat1Total / cat1Count).toFixed(1) : null,
      cat2Avg: cat2Count > 0 ? (cat2Total / cat2Count).toFixed(1) : null,
      cat3Avg: cat3Count > 0 ? (cat3Total / cat3Count).toFixed(1) : null,
      semesterAvg: semCount > 0 ? (semTotal / semCount).toFixed(1) : null,
      overallAvg:
        overallCount > 0 ? (overallTotal / overallCount).toFixed(1) : "0",
      studentCount: subjectMarks.length,
    };
  });

  // Prepare chart data for different exam types
  const overallChartData = subjectsWithStats.map((s) => ({
    name: s.code,
    average: parseFloat(s.overallAvg),
  }));

  const cat1ChartData = subjectsWithStats
    .filter((s) => s.cat1Avg !== null)
    .map((s) => ({
      name: s.code,
      average: parseFloat(s.cat1Avg!),
    }));

  const cat2ChartData = subjectsWithStats
    .filter((s) => s.cat2Avg !== null)
    .map((s) => ({
      name: s.code,
      average: parseFloat(s.cat2Avg!),
    }));

  const cat3ChartData = subjectsWithStats
    .filter((s) => s.cat3Avg !== null)
    .map((s) => ({
      name: s.code,
      average: parseFloat(s.cat3Avg!),
    }));

  const semesterChartData = subjectsWithStats
    .filter((s) => s.semesterAvg !== null)
    .map((s) => ({
      name: s.code,
      average: parseFloat(s.semesterAvg!),
    }));

  // Calculate department-wide statistics
  const totalSubjects = subjectList.length;
  const avgPerformance =
    subjectsWithStats.length > 0
      ? (
          subjectsWithStats.reduce(
            (sum, s) => sum + parseFloat(s.overallAvg),
            0
          ) / subjectsWithStats.length
        ).toFixed(1)
      : "0";

  const getPerformanceColor = (avg: string | null) => {
    if (!avg) return "text-gray-600 bg-gray-50";
    const percentage = parseFloat(avg);
    if (percentage >= 75)
      return "text-emerald-700 bg-linear-to-br from-emerald-50 to-emerald-100 border-emerald-200";
    if (percentage >= 60)
      return "text-blue-700 bg-linear-to-br from-blue-50 to-blue-100 border-blue-200";
    if (percentage >= 50)
      return "text-amber-700 bg-linear-to-br from-amber-50 to-amber-100 border-amber-200";
    return "text-red-700 bg-linear-to-br from-red-50 to-red-100 border-red-200";
  };

  const getPerformanceBadge = (avg: string | null) => {
    if (!avg) return { icon: Activity, color: "text-gray-500" };
    const percentage = parseFloat(avg);
    if (percentage >= 75) return { icon: Award, color: "text-emerald-600" };
    if (percentage >= 60) return { icon: TrendingUp, color: "text-blue-600" };
    return { icon: Activity, color: "text-amber-600" };
  };

  return (
    <section className="w-full pb-8">
      {/* Header with gradient background */}
      <div className="relative mb-8 -mx-6 -mt-6 px-6 pt-6 pb-8 bg-linear-to-br from-primary-admin/10 via-primary-admin/5 to-transparent border-b border-primary-admin/10">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-md border border-primary-admin/20">
            <BarChart3 className="w-8 h-8 text-primary-admin" />
          </div>
          <div className="flex-1">
            <h2 className="text-4xl font-bold text-gray-900 mb-2">
              Subjects & Analytics
            </h2>
            <p className="text-gray-600 text-lg">
              Comprehensive performance overview across all subjects
            </p>
          </div>
        </div>
      </div>

      {/* Admin-only subject management */}
      {session.user.role === "admin" && (
        <div className="mb-8">
          <SubjectAdminPanel
            initialSubjects={subjectList}
            departmentId={session.user.departmentId}
          />
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-2 border-primary-admin/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-primary-admin/10 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary-admin/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-primary-admin" />
              </div>
              <CardDescription className="text-sm font-medium">
                Total Subjects
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-primary-admin to-primary-admin/70 bg-clip-text text-transparent">
              {totalSubjects}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">
              Across all semesters
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
                Department Average
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              {avgPerformance}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">
              Overall performance
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-blue-100/50 to-transparent rounded-full -mr-16 -mt-16" />
          <CardHeader className="pb-3 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <CardDescription className="text-sm font-medium">
                Active Enrollments
              </CardDescription>
            </div>
            <CardTitle className="text-5xl font-bold bg-linear-to-br from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {marksData.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 font-medium">Student records</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject Cards Grid */}
      <Card className="mb-8 border-2 border-gray-200 shadow-lg">
        <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-admin/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-admin" />
            </div>
            <div>
              <CardTitle className="text-2xl">All Subjects</CardTitle>
              <CardDescription className="text-base">
                Performance breakdown by subject and exam type
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {subjectList.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-linear-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                No subjects found
              </p>
              <p className="text-gray-500 mb-6">
                Subjects will appear here once added
              </p>
              {session.user.role === "admin" && (
                <p className="text-sm text-primary-admin font-medium">
                  Use the panel above to add your first subject
                </p>
              )}
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {subjectsWithStats.map((subject) => {
                const Badge = getPerformanceBadge(subject.overallAvg);
                return (
                  <Card
                    key={subject.id}
                    className="group relative overflow-hidden border-2 hover:border-primary-admin/40 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    {/* Decorative gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-primary-admin/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:from-primary-admin/10 transition-all" />

                    <CardHeader className="pb-4 relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl mb-2 truncate group-hover:text-primary-admin transition-colors">
                            {subject.name}
                          </CardTitle>
                          <CardDescription className="font-mono text-sm font-semibold bg-gray-100 px-3 py-1 rounded-md inline-block">
                            {subject.code}
                          </CardDescription>
                        </div>
                        <div className="shrink-0 p-2 bg-primary-admin/10 rounded-lg">
                          <Badge.icon className={`w-5 h-5 ${Badge.color}`} />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Overall Average - Prominent */}
                      <div
                        className={`flex items-center justify-between p-4 rounded-xl border-2 ${getPerformanceColor(
                          subject.overallAvg
                        )} shadow-sm`}
                      >
                        <div>
                          <span className="text-sm font-semibold block mb-1">
                            Overall Average
                          </span>
                          <span className="text-xs opacity-75">
                            All assessments
                          </span>
                        </div>
                        <span className="text-3xl font-bold">
                          {subject.overallAvg}%
                        </span>
                      </div>

                      {/* Exam Type Breakdown */}
                      <div className="grid grid-cols-2 gap-3">
                        {subject.cat1Avg && (
                          <div className="flex flex-col p-3 rounded-lg bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200">
                            <span className="text-xs text-blue-700 font-semibold mb-1">
                              CAT 1
                            </span>
                            <span className="text-lg font-bold text-blue-800">
                              {subject.cat1Avg}%
                            </span>
                          </div>
                        )}
                        {subject.cat2Avg && (
                          <div className="flex flex-col p-3 rounded-lg bg-linear-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                            <span className="text-xs text-emerald-700 font-semibold mb-1">
                              CAT 2
                            </span>
                            <span className="text-lg font-bold text-emerald-800">
                              {subject.cat2Avg}%
                            </span>
                          </div>
                        )}
                        {subject.cat3Avg && (
                          <div className="flex flex-col p-3 rounded-lg bg-linear-to-br from-amber-50 to-amber-100 border border-amber-200">
                            <span className="text-xs text-amber-700 font-semibold mb-1">
                              CAT 3
                            </span>
                            <span className="text-lg font-bold text-amber-800">
                              {subject.cat3Avg}%
                            </span>
                          </div>
                        )}
                        {subject.semesterAvg && (
                          <div className="flex flex-col p-3 rounded-lg bg-linear-to-br from-purple-50 to-purple-100 border border-purple-200">
                            <span className="text-xs text-purple-700 font-semibold mb-1">
                              Semester
                            </span>
                            <span className="text-lg font-bold text-purple-800">
                              {subject.semesterAvg}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Student Count */}
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">
                            Students Enrolled
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {subject.studentCount}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="bg-linear-to-r from-gray-50 to-white border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-admin/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary-admin" />
            </div>
            <div>
              <CardTitle className="text-2xl">Performance Analytics</CardTitle>
              <CardDescription className="text-base">
                Visual comparison of subject performance across exam types
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="overall" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100">
              <TabsTrigger
                value="overall"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md py-3"
              >
                <div className="flex flex-col items-center gap-1">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-semibold">Overall</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="cat1"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md py-3"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold">CAT 1</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="cat2"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md py-3"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold">CAT 2</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="cat3"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md py-3"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold">CAT 3</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="semester"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md py-3"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold">Semester</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overall" className="mt-6">
              <SubjectChart data={overallChartData} />
            </TabsContent>

            <TabsContent value="cat1" className="mt-6">
              {cat1ChartData.length > 0 ? (
                <SubjectChart data={cat1ChartData} />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-1">
                    No CAT 1 data available
                  </p>
                  <p className="text-sm text-gray-500">
                    Data will appear once CAT 1 marks are recorded
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cat2" className="mt-6">
              {cat2ChartData.length > 0 ? (
                <SubjectChart data={cat2ChartData} />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-1">
                    No CAT 2 data available
                  </p>
                  <p className="text-sm text-gray-500">
                    Data will appear once CAT 2 marks are recorded
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="cat3" className="mt-6">
              {cat3ChartData.length > 0 ? (
                <SubjectChart data={cat3ChartData} />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-1">
                    No CAT 3 data available
                  </p>
                  <p className="text-sm text-gray-500">
                    Data will appear once CAT 3 marks are recorded
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="semester" className="mt-6">
              {semesterChartData.length > 0 ? (
                <SubjectChart data={semesterChartData} />
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-1">
                    No semester exam data available
                  </p>
                  <p className="text-sm text-gray-500">
                    Data will appear once semester marks are recorded
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
