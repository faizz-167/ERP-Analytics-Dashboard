"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ExamData {
  name: string;
  average: number;
  count: number;
}

interface PerformanceData {
  name: string;
  value: number;
  color: string;
}

interface AttendanceData {
  name: string;
  value: number;
  color: string;
}

interface DepartmentChartsProps {
  examData: ExamData[];
  performanceData: PerformanceData[];
  attendanceData: AttendanceData[];
}

// Move tooltip components outside of the main component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-2 shadow-sm">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">
          Average:{" "}
          <span className="font-medium text-primary">
            {Number(payload[0].value).toFixed(1)}%
          </span>
        </p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="rounded-lg border bg-white p-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: data.payload.fill || data.payload.color }}
          />
          <span className="text-sm font-semibold">{data.name}:</span>
          <span className="text-sm font-medium">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DepartmentCharts({
  examData,
  performanceData,
  attendanceData,
}: DepartmentChartsProps) {
  // Convert data to proper format for Recharts
  const formattedAttendanceData = useMemo(
    () =>
      attendanceData.map((item) => ({
        ...item,
        [item.name]: item.value,
      })),
    [attendanceData]
  );

  const formattedPerformanceData = useMemo(
    () =>
      performanceData.map((item) => ({
        ...item,
        [item.name]: item.value,
      })),
    [performanceData]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Exam-wise Performance Bar Chart - Takes 2 columns */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Exam-wise Performance Trends</CardTitle>
          <CardDescription>
            Average scores across different examination types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={examData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 12 }}
                axisLine={{ stroke: "#e2e8f0" }}
                domain={[0, 100]}
                label={{
                  value: "Average (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="average" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {examData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.average >= 75
                        ? "#22c55e"
                        : entry.average >= 60
                        ? "#3b82f6"
                        : entry.average >= 50
                        ? "#f59e0b"
                        : "#ef4444"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Exam Statistics */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {examData.map((exam, idx) => (
              <div
                key={idx}
                className="text-center p-3 rounded-lg bg-muted/30 border"
              >
                <p className="text-xs text-muted-foreground font-medium">
                  {exam.name}
                </p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {exam.average.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {exam.count} exams
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Distribution</CardTitle>
          <CardDescription>Overall attendance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={formattedAttendanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {attendanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {attendanceData.map((item, idx) => (
              <div
                key={idx}
                className="text-center p-3 rounded-lg border"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <div
                  className="size-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: item.color }}
                />
                <p className="text-xs text-muted-foreground">{item.name}</p>
                <p className="text-xl font-bold mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Distribution Pie Chart - Takes full width */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Student Performance Distribution</CardTitle>
          <CardDescription>
            Breakdown of students by performance categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={formattedPerformanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ value, percent }) =>
                    value > 0 ? `${((percent || 0) * 100).toFixed(0)}%` : ""
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-sm font-medium">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Performance Cards */}
            <div className="flex flex-col justify-center gap-4">
              {performanceData.map((perf, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow"
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: perf.color,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                      style={{ backgroundColor: perf.color }}
                    >
                      {perf.value}
                    </div>
                    <div>
                      <p className="font-semibold text-base">{perf.name}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-2xl font-bold"
                      style={{ color: perf.color }}
                    >
                      {performanceData.reduce((sum, p) => sum + p.value, 0) > 0
                        ? (
                            (perf.value /
                              performanceData.reduce(
                                (sum, p) => sum + p.value,
                                0
                              )) *
                            100
                          ).toFixed(0)
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">of total</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
