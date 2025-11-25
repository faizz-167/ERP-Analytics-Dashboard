"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useMemo } from "react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const getGrade = (score: number) => {
      if (score >= 90)
        return { grade: "A+", color: "text-emerald-600", bg: "bg-emerald-50" };
      if (score >= 80)
        return { grade: "A", color: "text-emerald-500", bg: "bg-emerald-50" };
      if (score >= 70)
        return { grade: "B", color: "text-blue-600", bg: "bg-blue-50" };
      if (score >= 60)
        return { grade: "C", color: "text-amber-600", bg: "bg-amber-50" };
      if (score >= 50)
        return { grade: "D", color: "text-orange-600", bg: "bg-orange-50" };
      return { grade: "F", color: "text-red-600", bg: "bg-red-50" };
    };

    const gradeInfo = getGrade(value);

    return (
      <div className="bg-white p-4 border-2 border-gray-200 shadow-2xl rounded-xl min-w-[180px] animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">{label}</p>
          <div
            className={`px-2 py-1 rounded-md ${gradeInfo.bg} border border-gray-200`}
          >
            <span className={`text-xs font-bold ${gradeInfo.color}`}>
              {gradeInfo.grade}
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-3xl font-bold bg-linear-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {value}%
          </p>
          <span className="text-xs font-medium text-gray-400">Average</span>
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    );
  }
  return null;
};

export default function SubjectChart({ data }: { data: any[] }) {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map((d) => d.average);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const topPerformer = data.find((d) => d.average === max);

    return { avg, max, min, topPerformer };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center border-2 border-gray-200">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg border-2 border-gray-200 h-full">
      {/* Header with Stats */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-linear-to-br from-indigo-500 to-purple-500 rounded-lg shadow-md">
              <BarChart className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">
              Subject Performance
            </h2>
          </div>
          <p className="text-sm text-gray-500 ml-11">
            Comparative analysis across subjects
          </p>
        </div>

        {stats && (
          <div className="flex gap-2">
            <div className="px-3 py-2 bg-linear-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
              <p className="text-xs text-gray-600 font-medium mb-1">
                Class Avg
              </p>
              <p className="text-lg font-bold text-indigo-600">
                {stats.avg.toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Performance Insights */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-linear-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">
                Highest
              </span>
            </div>
            <p className="text-xl font-bold text-emerald-700">
              {stats.max.toFixed(1)}%
            </p>
            <p className="text-xs text-emerald-600 mt-1 font-medium truncate">
              {stats.topPerformer?.name}
            </p>
          </div>

          <div className="p-3 bg-linear-to-br from-red-50 to-red-100 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-semibold text-red-700">Lowest</span>
            </div>
            <p className="text-xl font-bold text-red-700">
              {stats.min.toFixed(1)}%
            </p>
          </div>

          <div className="p-3 bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700">Range</span>
            </div>
            <p className="text-xl font-bold text-blue-700">
              {(stats.max - stats.min).toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-[350px] w-full bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={40}
            margin={{ top: 10, right: 10, left: -10, bottom: 10 }}
          >
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8} />
              </linearGradient>

              {/* Performance-based gradients */}
              <linearGradient
                id="excellentGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>

              <linearGradient id="goodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
              </linearGradient>

              <linearGradient id="averageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
              </linearGradient>

              <linearGradient id="poorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
              strokeWidth={1}
            />

            <XAxis
              dataKey="name"
              axisLine={{ stroke: "#d1d5db", strokeWidth: 2 }}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 13, fontWeight: 600 }}
              dy={8}
            />

            <YAxis
              axisLine={{ stroke: "#d1d5db", strokeWidth: 2 }}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              label={{
                value: "Average (%)",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6b7280", fontSize: 12, fontWeight: 600 },
              }}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#f3f4f6", opacity: 0.5, radius: 8 }}
            />

            <Bar
              dataKey="average"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationBegin={0}
            >
              {data.map((entry, index) => {
                const value = entry.average;
                let fillGradient = "url(#poorGradient)";
                if (value >= 75) fillGradient = "url(#excellentGradient)";
                else if (value >= 60) fillGradient = "url(#goodGradient)";
                else if (value >= 50) fillGradient = "url(#averageGradient)";

                return <Cell key={`cell-${index}`} fill={fillGradient} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Legend */}
      <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-linear-to-br from-emerald-500 to-emerald-600" />
          <span className="text-xs font-medium text-gray-600">
            Excellent (75%+)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-linear-to-br from-blue-500 to-blue-600" />
          <span className="text-xs font-medium text-gray-600">
            Good (60-74%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-linear-to-br from-amber-500 to-amber-600" />
          <span className="text-xs font-medium text-gray-600">
            Average (50-59%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-linear-to-br from-red-500 to-red-600" />
          <span className="text-xs font-medium text-gray-600">
            Needs Improvement (&lt;50%)
          </span>
        </div>
      </div>
    </div>
  );
}
