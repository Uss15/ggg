import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface StatsChartProps {
  stats: {
    totalBags: number;
    collected: number;
    inTransport: number;
    inLab: number;
    analyzed: number;
    archived: number;
  };
}

const COLORS = {
  collected: "hsl(var(--chart-1))",
  inTransport: "hsl(var(--chart-2))",
  inLab: "hsl(var(--chart-3))",
  analyzed: "hsl(var(--chart-4))",
  archived: "hsl(var(--chart-5))",
};

export function StatsChart({ stats }: StatsChartProps) {
  const barData = [
    { name: "Collected", value: stats.collected, fill: COLORS.collected },
    { name: "In Transit", value: stats.inTransport, fill: COLORS.inTransport },
    { name: "In Lab", value: stats.inLab, fill: COLORS.inLab },
    { name: "Analyzed", value: stats.analyzed, fill: COLORS.analyzed },
    { name: "Archived", value: stats.archived, fill: COLORS.archived },
  ];

  const pieData = barData.filter((item) => item.value > 0);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Evidence Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
