import { useFairnessAudit } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info, Loader2, Shield, Scale, TrendingDown, Users, Home, Wifi } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useClassSelection } from "@/contexts/ClassContext";

// Map of fairness factors to display names and icons
const FAIRNESS_FACTORS = {
  gender: { label: "Gender", icon: "👥", category: "Demographics" },
  income: { label: "Family Income", icon: "💰", category: "Socioeconomic" },
  parental_education: { label: "Parental Education", icon: "📚", category: "Family Background" },
  learning_disabilities: { label: "Learning Disabilities", icon: "♿", category: "Accessibility" },
  school_type: { label: "School Type", icon: "🏫", category: "Educational Setting" },
  internet_access: { label: "Internet Access", icon: "📡", category: "Digital Divide" },
  parental_involvement: { label: "Parental Involvement", icon: "👨‍👩‍👧", category: "Family Support" },
  distance_from_home: { label: "Distance from Home", icon: "🏠", category: "Accessibility" }
};

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
      <div className="space-y-6 max-w-7xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-4 w-96 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="shadow-sm">
                <CardContent className="p-5">
                  <div className="h-48 w-full bg-muted rounded" />
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
      <div className="p-8 text-center text-red-600 max-w-7xl mx-auto">
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
    g?.flag === "Potential bias" || g?.ratio < 0.8 || g?.ratio > 1.25
  );

  // Calculate overall fairness score
  const validRatios = groupEntries
    .map(([_, data]: [string, any]) => data?.ratio)
    .filter((r): r is number => typeof r === "number");
  
  const fairnessScore = validRatios.length > 0
    ? ((validRatios.filter(r => r >= 0.8 && r <= 1.25).length / validRatios.length) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl p-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">Fairness Audit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Disparate impact analysis across {Object.keys(FAIRNESS_FACTORS).length} protected dimensions
        </p>
      </div>

      {/* Overall Fairness Score */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Overall Fairness Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-foreground">{fairnessScore}%</span>
                <span className="text-sm text-muted-foreground">of dimensions fair</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${hasBias ? "text-destructive" : "text-success"}`}>
                {hasBias ? "⚠️" : "✓"}
              </div>
              <p className={`text-xs font-medium mt-1 ${hasBias ? "text-destructive" : "text-success"}`}>
                {hasBias ? "Issues Found" : "All Clear"}
              </p>
            </div>
          </div>
          <Progress value={Number(fairnessScore)} className="mt-4" />
        </CardContent>
      </Card>

      {hasBias && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Potential Equity Gaps Detected</AlertTitle>
          <AlertDescription className="text-sm mt-1">
            Review the flagged dimensions below. Disparate impact ratios outside 0.80–1.25 range indicate possible bias requiring attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Fairness Factors Grid */}
      {groupEntries.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            No fairness audit data available yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(FAIRNESS_FACTORS).map(([key, factor]) => {
              const groupData = fairnessData[key];
              if (!groupData) {
                return (
                  <Card
                    key={key}
                    className="shadow-sm border-dashed border-muted-foreground/30 opacity-50"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-lg">{factor.icon}</span>
                          <div>
                            <CardTitle className="text-sm font-heading font-bold leading-tight">
                              {factor.label}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{factor.category}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-center text-xs text-muted-foreground py-6">
                      No data available
                    </CardContent>
                  </Card>
                );
              }

              const ratio = groupData?.ratio ?? null;
              const flag = groupData?.flag ?? "Unknown";
              const isFlagged = flag === "Potential bias" || ratio < 0.8 || ratio > 1.25;
              const unprivRate = groupData?.unprivRate;
              const privRate = groupData?.privRate;
              const sampleUnpriv = groupData?.sample_unpriv;
              const samplePriv = groupData?.sample_priv;

              return (
                <Card
                  key={key}
                  className={`shadow-sm animate-fade-in transition-all ${
                    isFlagged
                      ? "border-destructive/50 bg-destructive/5 hover:border-destructive/70"
                      : "border-success/30 bg-success/5 hover:border-success/50"
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-lg">{factor.icon}</span>
                        <div>
                          <CardTitle className="text-sm font-heading font-bold leading-tight">
                            {factor.label}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground mt-0.5">{factor.category}</p>
                        </div>
                      </div>
                      <Badge
                        variant={isFlagged ? "destructive" : "secondary"}
                        className="text-xs shrink-0"
                      >
                        {isFlagged ? "⚠️ Flagged" : "✓ Pass"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {ratio != null ? (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-medium">
                              Disparate Impact Ratio
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                isFlagged ? "text-destructive" : "text-success"
                              }`}
                            >
                              {Number(ratio).toFixed(3)}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isFlagged ? "bg-destructive" : "bg-success"
                              }`}
                              style={{
                                width: `${Math.min(Math.max((ratio / 2) * 100, 0), 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-center">
                            Ideal: 0.80 – 1.25
                          </p>
                        </div>

                        {unprivRate != null && privRate != null && (
                          <div className="border-t pt-2 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">Rates</p>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Disadvantaged</span>
                              <span className="font-semibold">{(unprivRate * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Advantaged</span>
                              <span className="font-semibold">{(privRate * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                        )}

                        {sampleUnpriv != null && samplePriv != null && (
                          <div className="border-t pt-2 text-xs text-muted-foreground">
                            <p>Sample: {sampleUnpriv} / {samplePriv}</p>
                          </div>
                        )}

                        {isFlagged && (
                          <div className="flex items-start gap-2 mt-2 text-xs text-destructive bg-destructive/10 rounded p-2 border border-destructive/20">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 flex-none" />
                            <span className="leading-tight">
                              {ratio < 0.8
                                ? "Disadvantaged group underrepresented"
                                : "Disadvantaged group overrepresented"}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        {flag}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Key Interpretation Guide */}
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                How to Interpret
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                <strong>Disparate Impact Ratio:</strong> Ratio of unfavorable outcomes between disadvantaged and advantaged groups
              </p>
              <p>
                <strong>Safe Range (0.80 – 1.25):</strong> Indicates acceptable fairness under 80% rule in legal standards
              </p>
              <p>
                <strong>Below 0.80:</strong> Disadvantaged group faces adverse impact
              </p>
              <p>
                <strong>Above 1.25:</strong> Advantaged group appears to face adverse impact (potential reverse discrimination)
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}