import { Users, TrendingUp, AlertTriangle, Shield, BookOpen, Clock, Moon, Dumbbell, HeartPulse, GraduationCap, School } from "lucide-react";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { ClusterPieChart, FeatureImportanceChart, ChartSkeleton } from "@/components/dashboard/Charts";
import { UploadCSV } from "@/components/dashboard/UploadCSV";
import { useSummaryReport, useClusters, useFeatureImportance, useEarlyWarnings, useFairnessAudit } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useClassSelection } from "@/contexts/ClassContext";
import { Progress } from "@/components/ui/progress";

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
      {/* Header with Upload */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of student learning patterns and performance
          </p>
        </div>
        <div className="flex-shrink-0">
          <UploadCSV />
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

      {/* Cluster & Feature Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ClusterPieChart data={pieData} />
        <FeatureImportanceChart data={features} />
      </div>

      {/* EDA Metrics - Enhanced */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Behavioral Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {edaMetrics.map((m) => {
            // Determine health status based on metric value
            let healthColor = "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800";
            let iconColor = "text-green-600";
            
            if (m.label === "Avg Attendance" && m.value != null && m.value < 70) {
              healthColor = "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800";
              iconColor = "text-red-600";
            } else if (m.label === "Avg Study Hours" && m.value != null && m.value < 3) {
              healthColor = "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800";
              iconColor = "text-amber-600";
            } else if (m.label === "Avg Sleep" && (m.value == null || m.value < 6 || m.value > 9)) {
              healthColor = "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800";
              iconColor = "text-amber-600";
            }

            return (
              <Card key={m.label} className={`shadow-sm border ${healthColor}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <m.icon className={`h-4 w-4 ${iconColor}`} />
                    <span className="text-xs font-bold text-foreground">{m.value != null ? `${Number(m.value).toFixed(1)}${m.suffix}` : "—"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
                  {m.value != null && (
                    <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          m.label === "Avg Attendance" ? "bg-blue-500" :
                          m.label === "Avg Study Hours" ? "bg-purple-500" :
                          m.label === "Avg Sleep" ? "bg-indigo-500" :
                          m.label === "Avg Physical Activity" ? "bg-green-500" :
                          m.label === "Tutoring Rate" ? "bg-orange-500" :
                          "bg-pink-500"
                        }`}
                        style={{ width: `${Math.min((m.value / (m.label === "Avg Sleep" ? 10 : m.label === "Avg Attendance" ? 100 : m.label === "Avg Study Hours" ? 8 : 7)) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Early Warnings - Enhanced */}
      <Card className="shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading font-bold">At-Risk Students</CardTitle>
            <Badge variant={warnings?.length > 0 ? "destructive" : "secondary"} className="text-xs">
              {warnings?.length ?? 0} active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Students requiring immediate intervention</p>
        </CardHeader>
        <CardContent>
          {warningsQuery.isLoading && !warnings.length ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : warnings?.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                <AlertTriangle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No active warnings</p>
              <p className="text-xs text-muted-foreground mt-1">All students are performing well</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {warnings.slice(0, 10).map((w: any, i: number) => {
                const severity = w.clusterName === "The Disengaged Learner" ? "critical" : "warning";
                const severityColor = severity === "critical" ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900" : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900";
                const severityBadgeColor = severity === "critical" ? "destructive" : "default";
                
                return (
                  <div key={i} className={`flex items-center justify-between rounded-lg border p-3 ${severityColor}`}>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${severity === "critical" ? "bg-red-600" : "bg-amber-600"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">{w.name ?? `Student ${w.index ?? i + 1}`}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{w.clusterName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{w.score}</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                      <Badge variant={severityBadgeColor} className="text-xs whitespace-nowrap">
                        {severity === "critical" ? "Critical" : "At Risk"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {warnings.length > 10 && (
                <div className="text-center pt-2 text-xs text-muted-foreground">
                  +{warnings.length - 10} more
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}