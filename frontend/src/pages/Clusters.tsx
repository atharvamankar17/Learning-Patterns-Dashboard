import { useClusters, useFairnessAudit } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Lightbulb, AlertTriangle, Loader2 } from "lucide-react";
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
      <div className="space-y-6 max-w-5xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-5">
                  <Skeleton className="h-32 w-full" />
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
      <div className="p-8 text-center text-red-600">
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
  return (
    <div className="space-y-6 max-w-5xl p-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Clusters</h2>
        <p className="text-sm text-muted-foreground mt-1">Student groupings by learning patterns</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clusterList.map((cluster: any, i: number) => {
            const name = cluster?.name || `Cluster ${i}`;
            const count = cluster?.count ?? cluster?.size ?? 0;
            const avgScore = cluster?.avgScore ?? cluster?.average_score ?? cluster?.avg_score ?? 0;
            const recommendation = cluster?.recommendation ?? cluster?.description ?? "No recommendation available";

            return (
              <Card
                key={i}
                className="shadow-sm hover:shadow-md transition-shadow cursor-pointer animate-fade-in"
                onClick={() => navigate(`/students?cluster=${encodeURIComponent(name)}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-heading font-bold">{name}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{count} students</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Avg Score</span>
                      <span>{Number(avgScore).toFixed(1)}</span>
                    </div>
                    <Progress value={Math.min(Number(avgScore), 100)} className="h-2" />
                  </div>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="rec" className="border-none">
                      <AccordionTrigger className="text-xs text-muted-foreground py-1 hover:no-underline">
                        Recommendation
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-foreground pt-1">
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