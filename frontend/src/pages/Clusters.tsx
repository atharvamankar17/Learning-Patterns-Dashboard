import { useClusters, useFairnessAudit } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Lightbulb, AlertTriangle, TrendingDown, BarChart3, Zap, Target } from "lucide-react";
import { useClassSelection } from "@/contexts/ClassContext";
import { useNavigate } from "react-router-dom";

export default function Clusters() {
  const { selectedClass } = useClassSelection();
  const clustersQuery = useClusters(selectedClass);
  const fairnessQuery = useFairnessAudit(selectedClass);
  const navigate = useNavigate();

  // Safe extraction: clustersQuery.data is { clusters: [...] }
  const clusterList = clustersQuery.data?.clusters ?? [];  // ← array or empty array

  const hasBias = fairnessQuery.data
    ? Object.values(fairnessQuery.data).some((g: any) => g?.flag === "Potential bias" || g?.biased)
    : false;

  // ───────────────────────────────────────────────
  // Loading / Error states – prevents white screen
  // ───────────────────────────────────────────────
  if (clustersQuery.isLoading || fairnessQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-7xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-24 w-full bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-56 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (clustersQuery.isError || fairnessQuery.isError) {
    return (
      <div className="p-8 text-center text-red-600 max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-2">Failed to load clusters</h2>
        <p>{clustersQuery.error?.message || fairnessQuery.error?.message || "Unknown error"}</p>
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
  // Main render – now safe
  // ───────────────────────────────────────────────
  const clusterDistribution = clusterList.map(c => ({ name: c.name, value: c.count }));
  const totalStudents = clusterList.reduce((sum, c) => sum + (c.count || 0), 0);
  
  // Sort clusters by health status for better organization
  const sortedClusters = [...clusterList].sort((a: any, b: any) => {
    const healthOrder = { "Healthy": 0, "At Risk": 1, "Critical": 2 };
    return (healthOrder[a.healthStatus as keyof typeof healthOrder] || 3) - 
           (healthOrder[b.healthStatus as keyof typeof healthOrder] || 3);
  });

  return (
    <div className="space-y-6 max-w-7xl p-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Student Clusters</h2>
        <p className="text-sm text-muted-foreground mt-1">Learning pattern groups and cluster health analysis</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Students</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Healthy Clusters</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {sortedClusters.filter(c => c.healthStatus === "Healthy").length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">At Risk Clusters</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {sortedClusters.filter(c => c.healthStatus === "At Risk").length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Critical Clusters</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {sortedClusters.filter(c => c.healthStatus === "Critical").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {hasBias && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Equity gap detected —{" "}
            <button
              onClick={() => navigate("/fairness")}
              className="underline font-medium hover:text-primary"
            >
              check audit page
            </button>
          </AlertDescription>
        </Alert>
      )}

      {clusterList.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No cluster data available yet.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedClusters.map((cluster: any, i: number) => {
            const name = cluster?.name || `Cluster ${i}`;
            const count = cluster?.count ?? 0;
            const percentage = cluster?.percentage ?? 0;
            const avgScore = cluster?.avgScore ?? 0;
            const scoreVsAverage = cluster?.scoreVsAverage ?? 0;
            const avgEngagement = cluster?.avgEngagement ?? 0;
            const avgBurnout = cluster?.avgBurnout ?? 0;
            const atRiskCount = cluster?.atRiskCount ?? 0;
            const highPerformers = cluster?.highPerformers ?? 0;
            const lowPerformers = cluster?.lowPerformers ?? 0;
            const healthStatus = cluster?.healthStatus ?? "Unknown";
            const recommendation = cluster?.recommendation ?? "No recommendation available";

            const healthColor = {
              "Healthy": "border-green-300 bg-green-50 dark:bg-green-950/20",
              "At Risk": "border-amber-300 bg-amber-50 dark:bg-amber-950/20",
              "Critical": "border-red-300 bg-red-50 dark:bg-red-950/20"
            }[healthStatus] || "border-slate-300";

            const healthBadgeVariant = {
              "Healthy": "secondary",
              "At Risk": "default",
              "Critical": "destructive"
            }[healthStatus] as any;

            return (
              <Card
                key={i}
                className={`shadow-sm hover:shadow-lg transition-all animate-fade-in cursor-pointer overflow-hidden border-l-4 ${healthColor}`}
                onClick={() => navigate(`/students?cluster=${encodeURIComponent(name)}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-heading font-bold">{name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{count} students ({percentage}%)</p>
                    </div>
                    <Badge variant={healthBadgeVariant} className="text-xs shrink-0">
                      {healthStatus}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Performance Section */}
                  <div className="space-y-2 pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Average Score</span>
                      <span className="text-sm font-bold text-foreground">{Number(avgScore).toFixed(1)}/100</span>
                    </div>
                    <Progress value={Math.min(Number(avgScore), 100)} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>vs. Class Avg:</span>
                      <span className={scoreVsAverage >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {scoreVsAverage > 0 ? "+" : ""}{scoreVsAverage}%
                      </span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Engagement</p>
                      <p className="text-lg font-bold text-foreground">{Number(avgEngagement).toFixed(1)}</p>
                      <div className="w-full bg-muted rounded h-1">
                        <div
                          className="bg-blue-500 h-1 rounded"
                          style={{ width: `${Math.min(avgEngagement * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Burnout Risk</p>
                      <p className="text-lg font-bold text-foreground">{Number(avgBurnout).toFixed(1)}</p>
                      <div className="w-full bg-muted rounded h-1">
                        <div
                          className="bg-orange-500 h-1 rounded"
                          style={{ width: `${Math.min(avgBurnout, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Performance Distribution */}
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-xs font-semibold text-muted-foreground">Performance Distribution</p>
                    <div className="flex gap-2">
                      <div className="flex-1 text-center">
                        <p className="text-sm font-bold text-green-600">{highPerformers}</p>
                        <p className="text-xs text-muted-foreground">High (80+)</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm font-bold text-amber-600">{count - highPerformers - lowPerformers}</p>
                        <p className="text-xs text-muted-foreground">Average (60-80)</p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-sm font-bold text-red-600">{lowPerformers}</p>
                        <p className="text-xs text-muted-foreground">Low (&lt;60)</p>
                      </div>
                    </div>
                  </div>

                  {/* At Risk Alert */}
                  {atRiskCount > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-2">
                      <p className="text-xs font-medium text-red-700 dark:text-red-300">
                        {atRiskCount} at-risk student{atRiskCount !== 1 ? "s" : ""} in this cluster
                      </p>
                    </div>
                  )}

                  {/* Recommendation */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="rec" className="border-none">
                      <AccordionTrigger className="text-xs font-medium text-muted-foreground py-1 hover:no-underline">
                        Recommendation
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-foreground pt-2">
                        {recommendation}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}