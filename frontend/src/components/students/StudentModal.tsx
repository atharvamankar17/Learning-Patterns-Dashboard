import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sparkles, Loader2, Plus, AlertTriangle } from "lucide-react";
import {
  useStudentTimeline,
  useStudentDetail,
  useInterventions,
  usePredict,
  useWhatIf,
  useAddIntervention,
  useExplainStudent,
  useGenerateStrategy,
} from "@/hooks/use-api";

interface Props {
  student: any | null;
  open: boolean;
  onClose: () => void;
}

export function StudentModal({ student, open, onClose }: Props) {
  if (!open || !student) {
    return null;
  }

  const studentDetailQuery = useStudentDetail(student?.index ?? -1);
  const timelineQuery = useStudentTimeline(student?.index ?? -1);
  const interventionsQuery = useInterventions();
  const predictMutation = usePredict();
  const whatIfMutation = useWhatIf();
  const addInterventionMutation = useAddIntervention();
  const explainMutation = useExplainStudent();
  const strategyMutation = useGenerateStrategy();

  // Merge full data into safeStudent if available
  const fullData = studentDetailQuery.data ?? student ?? {};

  // Safe student data with defaults
  const safeStudent = {
    name: fullData?.name ?? fullData?.Name ?? "—",
    index: fullData?.index ?? fullData?.Index ?? fullData?.id ?? 0,
    examScore: fullData?.examScore ?? fullData?.Exam_Score ?? fullData?.score ?? "—",
    clusterName: fullData?.clusterName ?? fullData?.cluster ?? "—",
    hoursStudied: Number(fullData?.hoursStudied ?? fullData?.Hours_Studied ?? 20),
    attendance: Number(fullData?.attendance ?? fullData?.Attendance ?? 80),
    tutoringSessions: Number(fullData?.tutoringSessions ?? fullData?.Tutoring_Sessions ?? 0),
    sleepHours: Number(fullData?.sleepHours ?? fullData?.Sleep_Hours ?? 7),
    physicalActivity: Number(fullData?.physicalActivity ?? fullData?.Physical_Activity ?? 3),
    motivationLevel: fullData?.motivationLevel ?? fullData?.Motivation_Level ?? "—",
    parentalInvolvement: fullData?.parentalInvolvement ?? fullData?.Parental_Involvement ?? "—",
    familyIncome: fullData?.familyIncome ?? fullData?.Family_Income ?? "—",
    learningDisabilities: fullData?.learningDisabilities ?? fullData?.Learning_Disabilities ?? "—",
    gender: fullData?.gender ?? fullData?.Gender ?? "—",
    parentalEducation: fullData?.parentalEducationLevel ?? fullData?.Parental_Education_Level ?? "—",
    internetAccess: fullData?.internetAccess ?? fullData?.Internet_Access ?? "—",
    teacherQuality: fullData?.teacherQuality ?? fullData?.Teacher_Quality ?? "—",
    accessToResources: fullData?.accessToResources ?? fullData?.Access_to_Resources ?? "—",
    extracurricularActivities: fullData?.extracurricularActivities ?? fullData?.Extracurricular_Activities ?? "—",
    schoolType: fullData?.schoolType ?? fullData?.School_Type ?? "—",
    peerInfluence: fullData?.peerInfluence ?? fullData?.Peer_Influence ?? "—",
    distanceFromHome: fullData?.distanceFromHome ?? fullData?.Distance_from_Home ?? "—",
  };

  const idx = safeStudent.index;

  // Simulator state
  const [simHours, setSimHours] = useState(safeStudent.hoursStudied);
  const [simAttendance, setSimAttendance] = useState(safeStudent.attendance);
  const [simTutoring, setSimTutoring] = useState(safeStudent.tutoringSessions);

  // Sync simulator state when student data loads
  useEffect(() => {
    if (studentDetailQuery.data) {
      setSimHours(Number(fullData?.hoursStudied ?? fullData?.Hours_Studied ?? 20));
      setSimAttendance(Number(fullData?.attendance ?? fullData?.Attendance ?? 80));
      setSimTutoring(Number(fullData?.tutoringSessions ?? fullData?.Tutoring_Sessions ?? 0));
    }
  }, [studentDetailQuery.data]);

  // Intervention form
  const [intStrategy, setIntStrategy] = useState("");
  const [intOutcome, setIntOutcome] = useState("");

  const studentInterventions = interventionsQuery.data?.interventions?.filter((iv: any) =>
    (iv.studentIndex ?? iv.studentId) === idx
  ) ?? [];

  const score = safeStudent.examScore;

  const cluster_names = [
    "Low-Engagement Strugglers",
    "Resilient Under-Attenders",
    "Consistent Beginners",
    "High-Achieving Engagers"
  ];


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            {safeStudent.name}
            <Badge variant="secondary" className="text-xs">
              {safeStudent.clusterName}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Score: {safeStudent.examScore}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-2">
          <TabsList className="w-full grid grid-cols-5 h-9">
            <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
            <TabsTrigger value="simulator" className="text-xs">Simulator</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
            <TabsTrigger value="interventions" className="text-xs">Interventions</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-3">
            <Accordion type="multiple" defaultValue={["demo", "habits"]} className="space-y-1">
              <AccordionItem value="demo">
                <AccordionTrigger className="text-sm font-medium">Demographics</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Field label="Gender" value={safeStudent.gender} />
                    <Field label="Parental Education" value={safeStudent.parentalEducation} />
                    <Field label="Family Income" value={safeStudent.familyIncome} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="habits">
                <AccordionTrigger className="text-sm font-medium">Habits</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Field label="Study Hours" value={safeStudent.hoursStudied} />
                    <Field label="Attendance" value={`${safeStudent.attendance}%`} />
                    <Field label="Sleep Hours" value={safeStudent.sleepHours} />
                    <Field label="Physical Activity" value={safeStudent.physicalActivity} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="support">
                <AccordionTrigger className="text-sm font-medium">Support & Environment</AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Field label="Tutoring Sessions" value={safeStudent.tutoringSessions} />
                    <Field label="Internet Access" value={safeStudent.internetAccess} />
                    <Field label="Learning Disabilities" value={safeStudent.learningDisabilities} />
                    <Field label="Teacher Quality" value={safeStudent.teacherQuality} />
                    <Field label="Motivation Level" value={safeStudent.motivationLevel} />
                    <Field label="Access to Resources" value={safeStudent.accessToResources} />
                    <Field label="Extracurriculars" value={safeStudent.extracurricularActivities} />
                    <Field label="School Type" value={safeStudent.schoolType} />
                    <Field label="Peer Influence" value={safeStudent.peerInfluence} />
                    <Field label="Distance from Home" value={safeStudent.distanceFromHome} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="mt-3 space-y-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm">
                  <span className="font-medium">Current Score:</span> {safeStudent.examScore}
                </p>

                {predictMutation.data && (
                  <p className="text-sm">
                    <span className="font-medium">Predicted Score:</span>{" "}
                    {Number(predictMutation.data.predictedScore ?? predictMutation.data.predicted_score ?? 0).toFixed(1)}
                  </p>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => predictMutation.mutate(safeStudent)}
                  disabled={predictMutation.isPending}
                >
                  {predictMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Predict Score
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Button
                  size="sm"
                  onClick={() => explainMutation.mutate({ student_data: safeStudent })}
                  disabled={explainMutation.isPending}
                >
                  <Sparkles className="mr-1 h-3 w-3" />
                  {explainMutation.isPending ? "Analyzing..." : "Explain with AI"}
                </Button>

                {explainMutation.isPending && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generating detailed explanation... (5–20 seconds)
                  </p>
                )}

                {explainMutation.isError && (
                  <div className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-200">
                    Failed to generate explanation: {explainMutation.error?.message || "Unknown error"}
                    <br />
                    <small>Try again or check Gemini API status.</small>
                  </div>
                )}

                {explainMutation.data && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">AI Explanation:</p>
                    <div className="text-sm text-foreground whitespace-pre-wrap p-4 bg-muted/50 rounded-md border border-muted max-h-80 overflow-auto">
                      {explainMutation.data.explanation ??
                        explainMutation.data.response ??
                        explainMutation.data.text ??
                        explainMutation.data.content ??
                        "No detailed explanation received — response may be incomplete."}
                    </div>

                    {/* Debug raw response */}
                    <details className="mt-3 text-xs text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Show raw Gemini response (debug)
                      </summary>
                      <pre className="mt-2 p-3 bg-black/5 rounded overflow-auto max-h-60 text-[11px]">
                        {JSON.stringify(explainMutation.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Simulator Tab */}
          <TabsContent value="simulator" className="mt-3 space-y-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Hours Studied: {simHours}</Label>
                    <Slider
                      min={0}
                      max={40}
                      step={1}
                      value={[simHours]}
                      onValueChange={([v]) => setSimHours(v)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Attendance: {simAttendance}%</Label>
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[simAttendance]}
                      onValueChange={([v]) => setSimAttendance(v)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tutoring Sessions: {simTutoring}</Label>
                    <Slider
                      min={0}
                      max={10}
                      step={1}
                      value={[simTutoring]}
                      onValueChange={([v]) => setSimTutoring(v)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() =>
                    whatIfMutation.mutate({
                      original: safeStudent,
                      changes: {
                        hoursStudied: simHours,
                        attendance: simAttendance,
                        tutoringSessions: simTutoring,
                      },
                    })
                  }
                  disabled={whatIfMutation.isPending}
                >
                  {whatIfMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                  Run Simulation
                </Button>

                {whatIfMutation.data && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <MiniStat label="Original" value={whatIfMutation.data.original} />
                    <MiniStat label="Simulated" value={whatIfMutation.data.new} />
                    <MiniStat
                      label="Delta"
                      value={
                        whatIfMutation.data.difference != null
                          ? whatIfMutation.data.difference > 0
                            ? `+${Number(whatIfMutation.data.difference).toFixed(1)}`
                            : Number(whatIfMutation.data.difference).toFixed(1)
                          : "—"
                      }
                      positive={whatIfMutation.data.difference > 0}
                    />
                  </div>
                )}

                {whatIfMutation.isError && (
                  <p className="text-xs text-red-600 mt-2">
                    Simulation failed: {whatIfMutation.error?.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-3">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                {timelineQuery.isLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : timelineQuery.isError ? (
                  <p className="text-sm text-red-600 text-center py-8">
                    Failed to load timeline: {timelineQuery.error?.message}
                  </p>
                ) : timelineQuery.data?.labels?.length ? (() => {
                  // Transform object-of-arrays into array-of-objects for Recharts
                  const chartData = timelineQuery.data.labels.map((label: string, i: number) => ({
                    name: label,
                    scores: timelineQuery.data.scores?.[i] ?? 0,
                    sleep: timelineQuery.data.sleep?.[i] ?? 0,
                  }));

                  return (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="scores"
                          stroke="hsl(224, 76%, 48%)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Exam Score"
                        />
                        <Line
                          type="monotone"
                          dataKey="sleep"
                          stroke="hsl(160, 84%, 39%)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Sleep Hours"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  );
                })() : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No timeline data available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interventions Tab */}
          <TabsContent value="interventions" className="mt-3 space-y-4">
            {studentInterventions.length > 0 && (
              <div className="space-y-2">
                {studentInterventions.map((iv: any, i: number) => (
                  <Card key={i} className="shadow-sm">
                    <CardContent className="p-3 text-sm">
                      <p className="font-medium">{iv.strategy ?? iv.description ?? "No strategy"}</p>
                      {iv.outcome != null && (
                        <p className="text-muted-foreground mt-1">
                          Outcome: {iv.outcome}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="shadow-sm">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase">Add Intervention</p>
                <Textarea
                  placeholder="Describe the intervention strategy..."
                  value={intStrategy}
                  onChange={(e) => setIntStrategy(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
                <Input
                  placeholder="Outcome score (e.g. 75/100 or improvement points)"
                  value={intOutcome}
                  onChange={(e) => setIntOutcome(e.target.value)}
                  type="number"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!intStrategy.trim()) return;
                      addInterventionMutation.mutate({
                        studentIndex: idx,
                        strategy: intStrategy.trim(),
                        outcome: Number(intOutcome) || 0,
                      });
                      setIntStrategy("");
                      setIntOutcome("");
                    }}
                    disabled={!intStrategy.trim() || addInterventionMutation.isPending}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {addInterventionMutation.isPending ? "Adding…" : "Add"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      strategyMutation.mutate({
                        cluster_name: safeStudent.clusterName,
                        student_data: safeStudent,
                        past_interventions: studentInterventions,
                      })
                    }
                    disabled={strategyMutation.isPending}
                  >
                    <Sparkles className="mr-1 h-3 w-3" />
                    {strategyMutation.isPending ? "Generating…" : "AI Strategy"}
                  </Button>
                </div>

                {strategyMutation.data && (
                  <div className="text-sm text-foreground whitespace-pre-wrap mt-2 p-3 bg-muted/50 rounded-md">
                    {strategyMutation.data.strategies ??
                      strategyMutation.data.strategy ??
                      strategyMutation.data.response ??
                      "No strategies generated"}
                  </div>
                )}

                {strategyMutation.isError && (
                  <p className="text-xs text-red-600">
                    AI strategy failed: {strategyMutation.error?.message}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="py-1">
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

function MiniStat({ label, value, positive }: { label: string; value: any; positive?: boolean }) {
  return (
    <div className="text-center p-2 rounded-md bg-muted/50">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-heading font-bold ${positive === true ? "text-success" : positive === false ? "text-destructive" : "text-foreground"
          }`}
      >
        {value != null ? Number(value).toFixed?.(1) ?? value : "—"}
      </p>
    </div>
  );
}