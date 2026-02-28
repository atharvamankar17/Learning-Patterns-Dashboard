import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, uploadCSV } from "@/lib/api";
import { toast } from "sonner";
import { getIndianName } from "@/lib/nameGenerator";

const defaultOptions = { staleTime: 300000, retry: 2 };

export function useSummaryReport(className?: string) {
  return useQuery<any>({ queryKey: ["summary-report", className], queryFn: () => api.getSummaryReport(className), ...defaultOptions });
}

export function useClusters(className?: string) {
  return useQuery<{ clusters: any[] }>({ queryKey: ["clusters", className], queryFn: () => api.getClusters(className), ...defaultOptions });
}

export function useStudents(className?: string) {
  return useQuery<{ students: any[] }>({
    queryKey: ["students", className],
    queryFn: async () => {
      const data = await api.getStudents(className);
      data.students = data.students.map(s => ({ ...s, name: getIndianName(s.index) }));
      return data;
    },
    ...defaultOptions
  });
}

export function useStudentDetail(index: number) {
  return useQuery<any>({
    queryKey: ["student-detail", index],
    queryFn: async () => {
      const data = await api.getStudent(index);
      return { ...data, name: getIndianName(index) };
    },
    enabled: index >= 0,
    ...defaultOptions
  });
}

export function useEarlyWarnings(className?: string) {
  return useQuery<{ atRisk: any[] }>({
    queryKey: ["early-warnings", className],
    queryFn: async () => {
      const data = await api.getEarlyWarnings(className);
      data.atRisk = data.atRisk.map(w => ({ ...w, name: getIndianName(w.index) }));
      return data;
    },
    ...defaultOptions
  });
}

export function useFairnessAudit(className?: string) {
  return useQuery<any>({ queryKey: ["fairness-audit", className], queryFn: () => api.getFairnessAudit(className), ...defaultOptions });
}

export function useFeatureImportance(className?: string) {
  return useQuery<{ importance: any[] }>({ queryKey: ["feature-importance", className], queryFn: () => api.getFeatureImportance(className), ...defaultOptions });
}

export function useStudentTimeline(index: number) {
  return useQuery({
    queryKey: ["student-timeline", index],
    queryFn: () => api.getStudentTimeline(index),
    enabled: index >= 0,
    ...defaultOptions,
  });
}

export function useInterventions() {
  return useQuery({ queryKey: ["interventions"], queryFn: api.getInterventions, ...defaultOptions });
}

export function useUploadCSV() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadCSV,
    onSuccess: () => {
      toast.success("Data uploaded & models reclustered");
      qc.invalidateQueries();
    },
    onError: () => toast.error("Failed to upload CSV"),
  });
}

export function usePredict() {
  return useMutation({ mutationFn: api.predict });
}

export function useWhatIf() {
  return useMutation({ mutationFn: api.whatIf });
}

export function useAddIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.addIntervention,
    onSuccess: () => {
      toast.success("Intervention recorded");
      qc.invalidateQueries({ queryKey: ["interventions"] });
    },
    onError: () => toast.error("Failed to add intervention"),
  });
}

export function useExplainStudent() {
  return useMutation({ mutationFn: api.explainStudent });
}

export function useGenerateStrategy() {
  return useMutation({ mutationFn: api.generateStrategy });
}
