"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface AttendancePieChartProps {
  present: number;
  absent: number;
  total: number;
}

export default function AttendancePieChart({
  present,
  absent,
  total,
}: AttendancePieChartProps) {
  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
  ];

  const COLORS = {
    Present: "#22c55e",
    Absent: "#ef4444",
  };

  const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : "0";

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <svg
          className="w-16 h-16 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm">No attendance data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pie Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={COLORS[entry.name as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
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

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t">
        <div className="text-center p-3 rounded-lg bg-green-50">
          <div className="text-2xl font-bold text-green-600">{present}</div>
          <div className="text-xs text-green-700 font-medium">Present</div>
        </div>
        <div className="text-center p-3 rounded-lg bg-red-50">
          <div className="text-2xl font-bold text-red-600">{absent}</div>
          <div className="text-xs text-red-700 font-medium">Absent</div>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-100">
        <div className="text-3xl font-bold text-blue-600">{percentage}%</div>
        <div className="text-sm text-blue-700 font-medium mt-1">
          Attendance Rate
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {present} out of {total} classes
        </div>
      </div>
    </div>
  );
}
