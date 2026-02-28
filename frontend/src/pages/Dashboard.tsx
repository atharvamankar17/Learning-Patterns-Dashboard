import { Users, TrendingUp, AlertTriangle, Shield, BookOpen, Clock, Moon, Dumbbell, HeartPulse, GraduationCap, School } from "lucide-react";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { ClusterPieChart, FeatureImportanceChart, ChartSkeleton } from "@/components/dashboard/Charts";
import { UploadCSV } from "@/components/dashboard/UploadCSV";
import { useSummaryReport, useClusters, useFeatureImportance, useEarlyWarnings, useFairnessAudit } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassSelection } from "@/contexts/ClassContext";

export default function Dashboard() {
  const { selectedClass } = useClassSelection();

  const summaryQuery = useSummaryReport(selectedClass);
  const clustersQuery = useClusters(selectedClass);
  const featuresQuery = useFeatureImportance(selectedClass);
  const warningsQuery = useEarlyWarnings(selectedClass);
  const fairnessQuery = useFairnessAudit(selectedClass);

  // ───────────────────────────────────────────────
  // Safe data extraction
  // ───────────────────────────────────────────────
  const report = summaryQuery.data;
  const clusters = clustersQuery.data?.clusters ?? [];
  const features = featuresQuery.data?.importance ?? [];
  const warnings = warningsQuery.data?.atRisk ?? [];
  const fairness = fairnessQuery.data;

  // ───────────────────────────────────────────────
  // Computed stats
  // ───────────────────────────────────────────────
  const totalStudents = report?.totalStudents ?? "—";
  const avgScore = report?.avgExamScore != null ? Number(report.avgExamScore).toFixed(1) : "—";

  const highRiskPct = report?.highRiskPercent != null ? `${report.highRiskPercent}%` : "—";

  const fairnessStatus = fairness
    ? Object.values(fairness).some((g: any) => g?.flag === "Potential bias" || g?.biased)
      ? "Flagged"
      : "Pass"
    : "—";

  // Pie chart data
  const pieData = clusters.map((c: any, i: number) => ({
    name: c?.name || `Cluster ${i}`,
    value: c?.count ?? 0,
  }));

  // EDA metrics - using new standardized keys
  const edaMetrics = [
    { label: "Avg Attendance", value: report?.avgAttendance, icon: BookOpen, suffix: "%" },
    { label: "Avg Study Hours", value: report?.avgStudyHours, icon: Clock, suffix: "h" },
    { label: "Avg Sleep", value: report?.avgSleep, icon: Moon, suffix: "h" },
    { label: "Avg Physical Activity", value: report?.avgPhysicalActivity, icon: Dumbbell, suffix: "days/wk" },
    { label: "Tutoring Rate", value: report?.tutoringRate, icon: GraduationCap, suffix: "%" },
    { label: "Disability Rate", value: report?.disabilityRate, icon: HeartPulse, suffix: "%" },
  ];

  // ───────────────────────────────────────────────
  // Loading / Error states
  // ───────────────────────────────────────────────
  const isLoading = summaryQuery.isLoading || clustersQuery.isLoading || featuresQuery.isLoading || warningsQuery.isLoading || fairnessQuery.isLoading;

  if (isLoading && !report) { // Only show full loader if no data at all
    return (
      <div className="space-y-6 max-w-7xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const hasError = summaryQuery.isError;

  if (hasError && !report) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-xl font-bold mb-2">Failed to load dashboard</h2>
        <p>{summaryQuery.error?.message || "Unknown error occurred"}</p>
        <button
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // ───────────────────────────────────────────────
  // Main render
  // ───────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of student learning patterns and performance
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={totalStudents} icon={Users} />
        <StatCard title="Avg Exam Score" value={avgScore} icon={TrendingUp} subtitle="out of 100" />
        <StatCard title="High-Risk %" value={highRiskPct} icon={AlertTriangle} variant="warning" subtitle="Clusters 0 & 1" />
        <StatCard
          title="Fairness Status"
          value={fairnessStatus}
          icon={Shield}
          variant={fairnessStatus === "Flagged" ? "destructive" : "success"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClusterPieChart data={pieData} />
        <FeatureImportanceChart data={features} />
      </div>

      {/* EDA Metrics */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Exploratory Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {edaMetrics.map((m) => (
            <Card key={m.label} className="shadow-sm">
              <CardContent className="p-4 text-center">
                <m.icon className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
                <p className="text-lg font-bold text-foreground">
                  {m.value != null ? `${Number(m.value).toFixed(1)}${m.suffix}` : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Early Warnings */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Early Warnings</CardTitle>
        </CardHeader>
        <CardContent>
          {warningsQuery.isLoading && !warnings.length ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : warnings?.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active warnings</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {warnings.slice(0, 10).map((w: any, i: number) => (
                <div key={i} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-sm font-medium">{w.name ?? `Student ${w.index ?? i + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Score: {w.score}</span>
                    <Badge variant="outline" className="text-xs">
                      {w.issues?.join(", ") ?? "At risk"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}