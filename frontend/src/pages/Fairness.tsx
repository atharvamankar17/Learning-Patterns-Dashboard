import { useFairnessAudit } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info, Loader2, Shield, Scale } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useClassSelection } from "@/contexts/ClassContext";

export default function Fairness() {
  const { selectedClass } = useClassSelection();
  const fairnessQuery = useFairnessAudit(selectedClass);

  // Safe data extraction
  const fairnessData = fairnessQuery.data ?? {};
  const groupEntries = Object.entries(fairnessData).filter(
    ([key]) => key !== "status" && key !== "message"
  );

  // ───────────────────────────────────────────────
  // Loading / Error states
  // ───────────────────────────────────────────────
  if (fairnessQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-5xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-5">
                  <div className="h-36 w-full bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fairnessQuery.isError) {
    return (
      <div className="p-8 text-center text-red-600 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold mb-2">Failed to load fairness audit</h2>
        <p>{fairnessQuery.error?.message || "Unknown error occurred"}</p>
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
  const hasBias = Object.values(fairnessData).some((g: any) =>
    g?.flag === "Potential bias" || g?.ratio < 0.8 || g?.biased
  );

  return (
    <div className="space-y-6 max-w-5xl p-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Fairness Audit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Disparate impact analysis across protected groups
        </p>
      </div>

      {hasBias && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Potential equity gap detected in one or more groups — recommend reviewing policies and resource allocation.
          </AlertDescription>
        </Alert>
      )}

      {groupEntries.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            No fairness audit data available yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groupEntries.map(([groupName, groupData]: [string, any]) => {
            const ratio = groupData?.ratio ?? groupData?.disparate_impact_ratio ?? null;
            const flag = groupData?.flag ?? (ratio != null && ratio < 0.8 ? "Potential bias" : "Acceptable");
            const isFlagged = flag === "Potential bias" || groupData?.biased;

            return (
              <Card
                key={groupName}
                className={`shadow-sm animate-fade-in ${isFlagged ? "border-destructive/30 bg-destructive/5" : ""}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-heading font-bold capitalize">
                      {groupName.replace(/_/g, " ")}
                    </CardTitle>
                    <Badge
                      variant={isFlagged ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {isFlagged ? "Flagged" : "Pass"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ratio != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Disparate Impact Ratio</span>
                      <span className={`font-medium ${isFlagged ? "text-destructive" : "text-success"}`}>
                        {Number(ratio).toFixed(3)}
                      </span>
                    </div>
                  )}

                  {groupData?.unprivRate != null && groupData?.privRate != null && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Group Rates</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Unprivileged</span>
                        <span>{(groupData.unprivRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Privileged</span>
                        <span>{(groupData.privRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  {isFlagged && (
                    <div className="flex items-start gap-2 mt-2 text-xs text-destructive bg-destructive/5 rounded-md p-2">
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        Adverse impact detected — recommend reviewing policies and resource allocation for this group.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}