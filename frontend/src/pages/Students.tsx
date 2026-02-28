import { useState, useMemo } from "react";
import { useStudents } from "@/hooks/use-api";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { StudentModal } from "@/components/students/StudentModal";

// Hardcoded cluster names (must match backend exactly)
const cluster_names = [
  "The Overworked Achiever",
  "The Disengaged Learner",
  "The Balanced Achiever",
  "The Developing Learner"
];

const PAGE_SIZE = 15;

export default function Students() {
  const studentsQuery = useStudents();
  const [searchParams] = useSearchParams();
  const clusterFilter = searchParams.get("cluster");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Safe data extraction
  const studentList = studentsQuery.data?.students ?? [];

  // Debug log – remove after testing
  // console.log("Students data:", studentsQuery.data);

  // ───────────────────────────────────────────────
  // Filtered & paged data – safe memoization
  // ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = studentList;

    // Cluster filter – match by name OR by numeric index
    if (clusterFilter != null) {
      const filterLower = clusterFilter.toLowerCase().trim();

      list = list.filter((s: any) => {
        const clusterName = (s.clusterName ?? s.Cluster ?? "").toString().trim().toLowerCase();
        const clusterIndex = cluster_names.findIndex(name => name.toLowerCase() === clusterName);
        const numericIndexStr = clusterIndex !== -1 ? String(clusterIndex) : "";

        return (
          clusterName === filterLower ||
          numericIndexStr === filterLower ||
          String(s.cluster ?? s.Cluster ?? "") === filterLower
        );
      });
    }

    // Search filter
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter((s: any) =>
        Object.values(s).some((v) => String(v ?? "").toLowerCase().includes(q))
      );
    }

    return list;
  }, [studentList, clusterFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clusterDisplayName = clusterFilter != null
    ? isNaN(Number(clusterFilter)) ? clusterFilter : (cluster_names[Number(clusterFilter)] || `Cluster ${clusterFilter}`)
    : "All students";

  // ───────────────────────────────────────────────
  // Loading / Error states
  // ───────────────────────────────────────────────
  if (studentsQuery.isLoading) {
    return (
      <div className="space-y-4 max-w-7xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded" />
          </div>
          <div className="h-10 w-64 bg-muted rounded" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (studentsQuery.isError) {
    return (
      <div className="p-8 text-center text-red-600 max-w-7xl mx-auto">
        <h2 className="text-xl font-bold mb-2">Failed to load students</h2>
        <p>{studentsQuery.error?.message || "Unknown error occurred"}</p>
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
    <div className="space-y-4 max-w-7xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Students</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {clusterFilter != null ? `Filtered by ${clusterDisplayName}` : "All students"} · {filtered.length} total
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-lg bg-muted/30">
          {clusterFilter != null
            ? `No students found in ${clusterDisplayName}.`
            : "No students found matching your search."}
        </div>
      ) : (
        <>
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-medium w-[80px]">ID</TableHead>
                  <TableHead className="text-xs font-medium">Name</TableHead>
                  <TableHead className="text-xs font-medium">Score</TableHead>
                  <TableHead className="text-xs font-medium">Cluster</TableHead>
                  <TableHead className="text-xs font-medium hidden md:table-cell">Attendance</TableHead>
                  <TableHead className="text-xs font-medium hidden md:table-cell">Study Hrs</TableHead>
                  <TableHead className="text-xs font-medium hidden lg:table-cell">Tutoring</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((s: any, i: number) => (
                  <TableRow
                    key={s.index ?? i}
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setSelectedStudent(s)}
                  >
                    <TableCell className="text-sm font-medium text-muted-foreground">
                      #{s.index ?? i + 1}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {s.name ?? `Student ${s.index ?? i + 1}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {s.examScore ?? s.Exam_Score ?? s.score ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {s.clusterName ?? s.Cluster ?? s.cluster ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {s.attendance ?? s.Attendance ?? "—"}%
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell">
                      {s.studyHours ?? s.Hours_Studied ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm hidden lg:table-cell">
                      {s.tutoring ?? s.Tutoring_Sessions ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Page {page + 1} of {Math.max(totalPages, 1)}
            </p>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          open={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}