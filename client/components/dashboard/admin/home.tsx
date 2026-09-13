"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  FileText,
  ListOrdered,
  TrendingUp,
  TrendingDown,
  Minus,
  ChartNoAxesColumn,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { adminHomeContent as copy } from "@/data/dashboard/admin/home";
import {
  type StatData,
  type DonutChartSlice,
  type LineChartGranularity,
  getStats,
} from "@/services/dashboard/admin-home-service";

type LoadState = "loading" | "ready" | "error";

const DONUT_COLORS = ["#059669", "#34d399", "#a7f3d0"];

function computeTrend(current: number, previous: number | null) {
  if (previous === null || previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  return Math.round(delta * 10) / 10;
}

function TrendIndicator({
  current,
  previous,
}: {
  current: number;
  previous: number | null;
}) {
  const trend = computeTrend(current, previous);

  if (trend === null) {
    return <span className="text-xs text-slate-400">{copy.trend.noPreviousData}</span>;
  }

  if (trend > 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
        <TrendingUp className="w-3.5 h-3.5" />
        +{trend}% {copy.trend.vsLastMonth}
      </span>
    );
  }

  if (trend < 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-red-500">
        <TrendingDown className="w-3.5 h-3.5" />
        {trend}% {copy.trend.vsLastMonth}
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-xs font-medium text-slate-400">
      <Minus className="w-3.5 h-3.5" />
      0% {copy.trend.vsLastMonth}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  statData,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  description: string;
  statData: StatData;
}) {
  return (
    <div className="border border-slate-200 shadow-sm rounded-2xl bg-white p-6 flex flex-col hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex-1">
        <p className="text-3xl font-extrabold text-slate-900 font-heading">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {value === 0 ? copy.emptyState.noData : description}
        </p>
      </div>
      <div className="flex items-center gap-1 mt-auto pt-3 border-t border-slate-100 min-h-[20px]">
        <TrendIndicator current={statData.current} previous={statData.previous} />
      </div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <ChartNoAxesColumn className="w-10 h-10 text-slate-300" />
      <p className="text-sm text-slate-500 mt-2">{copy.emptyState.noData}</p>
      <p className="text-xs text-slate-400">{copy.emptyState.hint}</p>
    </div>
  );
}

const GRANULARITY_OPTIONS: { value: LineChartGranularity; label: string }[] = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
  { value: "year", label: "Yearly" },
];

function GranularityToggle({
  value,
  onChange,
}: {
  value: LineChartGranularity;
  onChange: (value: LineChartGranularity) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {GRANULARITY_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            value === option.value
              ? "bg-white text-emerald-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function QuizzesLineChart() {
  const [granularity, setGranularity] = useState<LineChartGranularity>("day");

  // Shares the ["admin-stats", granularity] cache key with the Home
  // component's own query below — when both resolve to the same
  // granularity ("day" by default), React Query dedupes them into a
  // single network request instead of firing twice on first load.
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-stats", granularity],
    queryFn: () => getStats(granularity),
  });

  const data = stats?.lineChart ?? [];
  const loadState: LoadState = isError ? "error" : isLoading ? "loading" : "ready";
  const isEmpty = !data || data.length === 0;

  return (
    <div className="border border-slate-200 shadow-sm rounded-2xl bg-white p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h3 className="text-base font-semibold text-slate-900">{copy.lineChart.title}</h3>
        <GranularityToggle value={granularity} onChange={setGranularity} />
      </div>

      {loadState === "error" ? (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <ChartNoAxesColumn className="w-10 h-10 text-slate-300" />
          <p className="text-sm text-slate-500 mt-2">Something went wrong</p>
        </div>
      ) : isEmpty ? (
        <EmptyChartState />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
              formatter={(value) => [value, copy.lineChart.seriesLabel]}
            />
            <Line
              type="monotone"
              dataKey="quizzes"
              stroke="#059669"
              strokeWidth={2}
              dot={{ fill: "#059669", r: 3 }}
              activeDot={{ r: 5, fill: "#15803d" }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function QuizTypeDonutChart({ data }: { data: DonutChartSlice[] }) {
  const isEmpty = !data || data.length === 0;
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="border border-slate-200 shadow-sm rounded-2xl bg-white p-6 flex flex-col">
      <h3 className="text-base font-semibold text-slate-900 mb-4">{copy.donutChart.title}</h3>

      {isEmpty ? (
        <EmptyChartState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} quizzes`, name]}
                contentStyle={{ borderRadius: "8px", fontSize: "12px" }}
                itemStyle={{ color: "#0f172a" }}
                labelStyle={{ color: "#0f172a" }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-col gap-3">
            {data.map((slice, index) => {
              const pct = total > 0 ? Math.round((slice.value / total) * 1000) / 10 : 0;
              return (
                <div key={slice.name} className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }}
                  />
                  <span className="text-sm font-medium text-slate-700 flex-1">
                    {slice.name}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY_STAT: StatData = { current: 0, previous: null };

export default function Home() {
  // Same ["admin-stats", "day"] key as QuizzesLineChart's default —
  // deduped by React Query into one request on first render.
  const { data: stats, isError } = useQuery({
    queryKey: ["admin-stats", "day"],
    queryFn: () => getStats("day"),
  });

  const totalUsers = stats?.totalUsers ?? EMPTY_STAT;
  const quizzesGenerated = stats?.quizzesGenerated ?? EMPTY_STAT;
  const avgQuestionsPerQuiz = stats?.avgQuestionsPerQuiz ?? EMPTY_STAT;
  const donutChartData = stats?.donutChart ?? [];

  const cards = [
    {
      icon: User,
      label: copy.stats.totalUsers.label,
      value: totalUsers.current,
      description: copy.stats.totalUsers.description,
      statData: totalUsers,
    },
    {
      icon: FileText,
      label: copy.stats.quizzesGenerated.label,
      value: quizzesGenerated.current,
      description: copy.stats.quizzesGenerated.description,
      statData: quizzesGenerated,
    },
    {
      icon: ListOrdered,
      label: copy.stats.avgQuestionsPerQuiz.label,
      value: avgQuestionsPerQuiz.current,
      description: copy.stats.avgQuestionsPerQuiz.description,
      statData: avgQuestionsPerQuiz,
    },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
        <ChartNoAxesColumn className="w-10 h-10 text-slate-300" />
        <p className="text-sm text-slate-500">Something went wrong</p>
        <p className="text-xs text-slate-400">We couldn't load the overview. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 items-stretch">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuizzesLineChart />
        <QuizTypeDonutChart data={donutChartData} />
      </div>
    </div>
  );
}