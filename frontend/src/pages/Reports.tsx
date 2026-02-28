import { useSummaryReport, useClusters } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { Download, FileBarChart, School, Users, GraduationCap, Clock, BookOpen, AlertCircle, FileText, PieChart as PieChartIcon, Activity } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981'];

export default function Reports() {
  const [selectedClass, setSelectedClass] = useState<string>("School");
  const reportRef = useRef<HTMLDivElement>(null);

  const summaryQuery = useSummaryReport(selectedClass);
  const clustersQuery = useClusters(selectedClass);
  const report = summaryQuery.data ?? {};
  const clusterList = clustersQuery.data?.clusters ?? [];

  const isLoading = summaryQuery.isLoading || clustersQuery.isLoading;

  if (isLoading && !report.totalStudents) {
    return (
      <div className="space-y-6 max-w-6xl p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const stats = [
    { label: "Total Students", value: report?.totalStudents, icon: Users, color: "text-blue-500" },
    { label: "Avg Exam Score", value: report?.avgExamScore != null ? `${report.avgExamScore}%` : "—", icon: GraduationCap, color: "text-green-500" },
    { label: "Attendance Rate", value: report?.avgAttendance != null ? `${report.avgAttendance}%` : "—", icon: BookOpen, color: "text-amber-500" },
    { label: "High Risk Students", value: report?.highRiskPercent != null ? `${report.highRiskPercent}%` : "—", icon: AlertCircle, color: "text-red-500" },
    { label: "Tutoring Rate", value: report?.tutoringRate != null ? `${report.tutoringRate}%` : "—", icon: Clock, color: "text-purple-500" },
    { label: "Disability Rate", value: report?.disabilityRate != null ? `${report.disabilityRate}%` : "—", icon: School, color: "text-cyan-500" },
  ];

  const barData = clusterList.map((c: any, i: number) => ({
    name: c?.name || `Cluster ${i}`,
    avgScore: c?.avgScore ?? 0,
    count: c?.count ?? 0,
  }));

  const pieData = Object.entries(report.clusterDistribution || {}).map(([key, val]) => ({
    name: clusterList[parseInt(key)]?.name || `Cluster ${key}`,
    value: Number(val) * 100,
  }));

  const radarData = [
    { subject: 'Study', A: report.avgStudyHours * 2.5, fullMark: 100 },
    { subject: 'Sleep', A: report.avgSleep * 10, fullMark: 100 },
    { subject: 'Activity', A: report.avgPhysicalActivity * 10, fullMark: 100 },
    { subject: 'Attendance', A: report.avgAttendance, fullMark: 100 },
    { subject: 'Score', A: report.avgExamScore, fullMark: 100 },
  ];

  const handleExportCSV = () => {
    const lines = ["Report Name,Learning Insights Overview"];
    lines.push(`Exported On,${new Date().toLocaleString()}`);
    lines.push(`Filter,${selectedClass}`);
    lines.push("");
    lines.push("Metric,Value");
    stats.forEach(s => lines.push(`${s.label},${s.value}`));
    lines.push("");
    lines.push("Cluster Name,Student Count,Average Score");
    barData.forEach(d => lines.push(`${d.name},${d.count},${d.avgScore}`));

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `report-${selectedClass.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`);
    toast.success("CSV report exported");
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    try {
      toast.loading("Generating PDF...", { id: "pdf-gen" });
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`report-${selectedClass.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF report exported", { id: "pdf-gen" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF", { id: "pdf-gen" });
    }
  };

  return (
    <div className="space-y-8 max-w-6xl p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-heading font-bold text-foreground">Academic Summary</h2>
          <p className="text-muted-foreground mt-2">
            Group performance analysis and factor correlation for {selectedClass === "School" ? "the entire school" : selectedClass}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button onClick={handleExportPDF} className="gap-2 bg-primary">
              <FileText className="h-4 w-4" /> PDF Report
            </Button>
          </div>
        </div>
      </div>

      <div ref={reportRef} className="space-y-8 bg-background p-4 rounded-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow border-none shadow-sm bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-none bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-primary" /> Engagement Performance
              </CardTitle>
              <CardDescription>Average scores vs student volume per cluster</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="avgScore" name="Avg Score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="count" name="Students" fill="hsl(var(--muted-foreground)/0.3)" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-orange-500" /> Student Distribution
              </CardTitle>
              <CardDescription>Population breakdown by engagement profile</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="h-[250px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none bg-card/50 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" /> Factor Impact Analysis
              </CardTitle>
              <CardDescription>Correlation between lifestyle habits and academic performance for this group</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Group Profile"
                      dataKey="A"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}