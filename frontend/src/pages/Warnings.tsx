import { useState } from "react";
import { useEarlyWarnings } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Download, AlertCircle, TrendingDown, Clock, Search, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { Input } from "@/components/ui/input";
import { StudentModal } from "@/components/students/StudentModal";
import { useClassSelection } from "@/contexts/ClassContext";

export default function Warnings() {
  const { selectedClass } = useClassSelection();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const warningsQuery = useEarlyWarnings(selectedClass);

  // Safe data extraction
  const warningsList = warningsQuery.data?.atRisk ?? [];

  // ───────────────────────────────────────────────
  // Loading / Error states – prevents white screen
  // ───────────────────────────────────────────────
  if (warningsQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-6xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
          <Skeleton className="h-10 w-32 rounded" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (warningsQuery.isError) {
    return (
      <div className="p-8 text-center text-red-600 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold mb-2">Failed to load warnings</h2>
        <p>{warningsQuery.error?.message || "Unknown error occurred"}</p>
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
  // Export handler – safe
  // ───────────────────────────────────────────────
  const handleExport = () => {
    if (warningsList.length === 0) return;

    // Headers from first item (safe)
    const headers = Object.keys(warningsList[0] || {}).join(",");
    const rows = warningsList.map((w: any) =>
      Object.values(w)
        .map(v => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ).join("\n");

    const csvContent = headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "early-warnings.csv");
  };

  // ───────────────────────────────────────────────
  // Main render – now safe
  // ───────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Early Warnings</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Students at risk of declining performance
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={warningsList.length === 0}
        >
          <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      {warningsList.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            No warnings at this time — all students appear stable.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-medium">ID</TableHead>
                <TableHead className="text-xs font-medium">Student</TableHead>
                <TableHead className="text-xs font-medium">Risk Level</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Score</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Cluster</TableHead>
                <TableHead className="text-xs font-medium">Alert</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warningsList.map((w: any, i: number) => {
                const issues = w.issues ?? w.alerts ?? [];
                const riskLevel = issues.length > 2 ? "high" : issues.length > 0 ? "medium" : "low";

                return (
                  <TableRow key={i} className="animate-fade-in">
                    <TableCell className="text-sm font-medium text-muted-foreground">
                      #{w.index}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        {w.name ?? `Student ${w.index ?? i + 1}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={riskLevel === "high" ? "destructive" : riskLevel === "medium" ? "secondary" : "outline"}
                        className="text-xs capitalize"
                      >
                        {riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {w.score ?? w.exam_score ?? w.Exam_Score ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {w.clusterName ?? w.cluster ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {issues.length > 0
                        ? issues.join(", ")
                        : "Risk of declining performance – recommend mentoring"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}