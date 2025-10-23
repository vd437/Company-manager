import { useEffect, useState } from "react";
import { Search, TrendingUp, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fakeDb } from "@/lib/fakeDb";
import AppLayout from "@/components/AppLayout";

interface EmployeeStats {
  employee_id: number;
  employee_name: string;
  total_hours: number;
  days_worked: number;
  total_sales: number;
}

const EmployeeStats = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<EmployeeStats[]>([]);
  const [filteredStats, setFilteredStats] = useState<EmployeeStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState<"week" | "month">("month");

  useEffect(() => {
    fetchStats();
  }, [period]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = stats.filter((stat) =>
        stat.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStats(filtered);
    } else {
      setFilteredStats(stats);
    }
  }, [searchQuery, stats]);

  const fetchStats = async () => {
    try {
      // Get all employees
      const employees = await fakeDb.employees.findAll();

      // Generate mock stats for demonstration
      const statsArray: EmployeeStats[] = employees.map((emp) => ({
        employee_id: emp.id,
        employee_name: emp.fullName,
        total_hours: Math.floor(Math.random() * 160) + 40, // Random hours between 40-200
        days_worked: Math.floor(Math.random() * 20) + 5, // Random days between 5-25
        total_sales: Math.floor(Math.random() * 100) + 10, // Random sales between 10-110
      })).sort((a, b) => b.total_hours - a.total_hours);

      setStats(statsArray);
      setFilteredStats(statsArray);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الإحصائيات",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold">إحصائيات الموظفين</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              الموظفون الأكثر عملاً
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن موظف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Calendar className="ml-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">هذا الأسبوع</SelectItem>
                  <SelectItem value="month">هذا الشهر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المرتبة</TableHead>
                    <TableHead className="text-right">اسم الموظف</TableHead>
                    <TableHead className="text-right">عدد أيام العمل</TableHead>
                    <TableHead className="text-right">إجمالي الساعات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        لا توجد بيانات متاحة
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStats.map((stat, index) => (
                      <TableRow key={stat.employee_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>{stat.employee_name}</TableCell>
                        <TableCell>{stat.days_worked} يوم</TableCell>
                        <TableCell>{stat.total_hours.toFixed(1)} ساعة</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default EmployeeStats;
