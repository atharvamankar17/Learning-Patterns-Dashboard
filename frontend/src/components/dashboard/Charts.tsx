import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, RadialBarChart, RadialBar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const BLUE_SHADES = [
  "hsl(224, 76%, 48%)",
  "hsl(224, 60%, 60%)",
  "hsl(224, 50%, 70%)",
  "hsl(224, 40%, 80%)",
];

interface ClusterPieProps {
  data: { name: string; value: number }[];
}

export function ClusterPieChart({ data }: ClusterPieProps) {
  return (
    <Card className="shadow-sm animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Cluster Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={BLUE_SHADES[i % BLUE_SHADES.length]} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: "12px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface FeatureBarProps {
  data: { name: string; importance: number }[];
}

export function FeatureImportanceChart({ data }: FeatureBarProps) {
  const sorted = [...data].sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance));
  return (
    <Card className="shadow-sm animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Feature Importance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 80, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={75} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
              {sorted.map((entry, i) => (
                <Cell key={i} fill={entry.importance >= 0 ? "hsl(224, 76%, 48%)" : "hsl(160, 84%, 39%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[260px] w-full rounded-md" />
      </CardContent>
    </Card>
  );
}

interface ScoreDistributionProps {
  data: { name: string; avgScore: number; count: number }[];
}

export function ScoreDistributionChart({ data }: ScoreDistributionProps) {
  return (
    <Card className="shadow-sm animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Cluster Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ left: 40, right: 20, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                fontSize: "12px",
              }}
              formatter={(value: any) => [`${Number(value).toFixed(1)}/100`, "Avg Score"]}
            />
            <Bar dataKey="avgScore" radius={[4, 4, 0, 0]} fill="hsl(224, 76%, 48%)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface PerformanceGaugeProps {
  percentage: number;
}

export function PerformanceGaugeChart({ percentage }: PerformanceGaugeProps) {
  const gaugeData = [{ name: "Performance", value: Math.min(percentage, 100), fill: "hsl(224, 76%, 48%)" }];
  
  return (
    <Card className="shadow-sm animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Overall Class Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-[260px]">
          <ResponsiveContainer width="100%" height={160}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              data={gaugeData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                background={{ fill: "hsl(var(--muted))" }}
                dataKey="value"
                cornerRadius={4}
                label={false}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <div className="text-3xl font-bold text-foreground">{Number(percentage).toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">out of 100</div>
            <div className={`text-xs font-semibold mt-1 ${
              percentage >= 80 ? "text-green-600" :
              percentage >= 70 ? "text-amber-600" :
              "text-red-600"
            }`}>
              {percentage >= 80 ? "Excellent" : percentage >= 70 ? "Good" : "Needs Improvement"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
