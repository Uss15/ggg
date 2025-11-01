import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Package, FileText, Calendar } from "lucide-react";

interface AnalyticsChartsProps {
  bags: any[];
  cases: any[];
}

export function AnalyticsCharts({ bags, cases }: AnalyticsChartsProps) {
  // Evidence by Status
  const statusData = [
    { name: "Collected", value: bags.filter(b => b.current_status === "collected").length, color: "#10b981" },
    { name: "In Transport", value: bags.filter(b => b.current_status === "in_transport").length, color: "#f59e0b" },
    { name: "In Lab", value: bags.filter(b => b.current_status === "in_lab").length, color: "#3b82f6" },
    { name: "Analyzed", value: bags.filter(b => b.current_status === "analyzed").length, color: "#8b5cf6" },
    { name: "Archived", value: bags.filter(b => b.current_status === "archived").length, color: "#6b7280" },
    { name: "Disposed", value: bags.filter(b => b.current_status === "disposed").length, color: "#ef4444" },
  ].filter(item => item.value > 0);

  // Evidence by Type
  const typeData = [
    { name: "Weapons", value: bags.filter(b => b.type === "weapon").length },
    { name: "Documents", value: bags.filter(b => b.type === "documents").length },
    { name: "Electronics", value: bags.filter(b => b.type === "electronics").length },
    { name: "Biological", value: bags.filter(b => b.type === "biological_sample").length },
    { name: "Other", value: bags.filter(b => b.type === "other").length },
  ].filter(item => item.value > 0);

  // Monthly trends (last 6 months)
  const getMonthlyData = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const evidenceCount = bags.filter(b => {
        const created = new Date(b.created_at);
        return created >= monthStart && created <= monthEnd;
      }).length;
      
      const caseCount = cases.filter(c => {
        const created = new Date(c.created_at);
        return created >= monthStart && created <= monthEnd;
      }).length;
      
      months.push({
        month: monthName,
        evidence: evidenceCount,
        cases: caseCount
      });
    }
    
    return months;
  };

  const monthlyData = getMonthlyData();

  // Case status distribution
  const caseStatusData = [
    { name: "Open", value: cases.filter(c => c.status === "open").length, color: "#10b981" },
    { name: "Closed", value: cases.filter(c => c.is_closed).length, color: "#6b7280" },
    { name: "Under Investigation", value: cases.filter(c => c.status === "investigating").length, color: "#f59e0b" },
  ].filter(item => item.value > 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Evidence Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Evidence by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Evidence by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Evidence by Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            6-Month Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="evidence" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Evidence Bags"
              />
              <Line 
                type="monotone" 
                dataKey="cases" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Cases"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Case Status */}
      {caseStatusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Cases by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={caseStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {caseStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
