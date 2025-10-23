import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, TrendingUp, Calendar, ChevronRight, Clock, BarChart3, Star, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { fakeDb } from "@/lib/fakeDb";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EmployeeStats {
  employee_id: number;
  employee_name: string;
  employee_avatar?: string;
  total_hours: number;
  days_worked: number;
  total_sales: number;
  this_month_hours: number;
  this_week_hours: number;
  today_hours: number;
}

const EmployeeStatsNew = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<EmployeeStats[]>([]);
  const [filteredStats, setFilteredStats] = useState<EmployeeStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState<"week" | "month">("month");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeStats | null>(null);
  const [showDetails, setShowDetails] = useState(false);

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
      const employees = await fakeDb.employees.findAll();

      // Generate realistic mock stats
      const statsArray: EmployeeStats[] = employees.map((emp) => ({
        employee_id: emp.id,
        employee_name: emp.fullName,
        employee_avatar: emp.avatarUrl,
        total_hours: Math.floor(Math.random() * 160) + 80,
        days_worked: Math.floor(Math.random() * 20) + 10,
        total_sales: Math.floor(Math.random() * 100) + 20,
        this_month_hours: Math.floor(Math.random() * 160) + 80,
        this_week_hours: Math.floor(Math.random() * 40) + 10,
        today_hours: Math.floor(Math.random() * 8) + 1,
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

  const topEmployees = filteredStats.slice(0, 3);
  const regularEmployees = filteredStats.slice(3);

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">إحصائيات الموظفين</h1>
            <p className="text-muted-foreground">تتبع أداء الفريق</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowRight className="ml-2 h-4 w-4 rotate-180" />
            رجوع
          </Button>
        </div>

        {/* Search and Filter */}
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

        {/* Top Performers */}
        {topEmployees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                الموظفون المتميزون
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {topEmployees.map((emp, index) => (
                  <Card 
                    key={emp.employee_id}
                    className="cursor-pointer hover:bg-accent transition-colors relative overflow-hidden"
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setShowDetails(true);
                    }}
                  >
                    <div className="absolute top-2 left-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                    </div>
                    <CardContent className="pt-8 text-center">
                      <Avatar className="h-20 w-20 mx-auto mb-3">
                        <AvatarImage src={emp.employee_avatar} />
                        <AvatarFallback className="text-2xl">
                          {emp.employee_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold">{emp.employee_name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {emp.total_hours.toFixed(1)} ساعة
                      </p>
                      <Progress 
                        value={emp.total_hours / 2} 
                        className="mt-3"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Employees - WhatsApp Style List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              جميع الموظفين
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {regularEmployees.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted-foreground">
                  لا توجد بيانات متاحة
                </div>
              ) : (
                regularEmployees.map((stat, index) => (
                  <div
                    key={stat.employee_id}
                    className="flex items-center gap-4 p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedEmployee(stat);
                      setShowDetails(true);
                    }}
                  >
                    {/* Avatar */}
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={stat.employee_avatar} />
                      <AvatarFallback className="text-lg">
                        {stat.employee_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{stat.employee_name}</h3>
                        <Badge variant="outline" className="text-xs">
                          #{index + 4}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{stat.total_hours.toFixed(1)} ساعة</span>
                        <span>•</span>
                        <span>{stat.days_worked} يوم</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="sm:max-w-[600px]" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedEmployee?.employee_avatar} />
                  <AvatarFallback>
                    {selectedEmployee?.employee_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div>{selectedEmployee?.employee_name}</div>
                  <div className="text-sm text-muted-foreground font-normal">
                    إحصائيات الأداء
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedEmployee && (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                  <TabsTrigger value="details">التفاصيل</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold">{selectedEmployee.total_hours.toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">إجمالي الساعات</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold">{selectedEmployee.days_worked}</div>
                          <div className="text-sm text-muted-foreground">أيام العمل</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="text-2xl font-bold">{selectedEmployee.total_sales}</div>
                          <div className="text-sm text-muted-foreground">عدد المبيعات</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
                          <div className="text-2xl font-bold">{(selectedEmployee.total_hours / selectedEmployee.days_worked).toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">معدل الساعات/يوم</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  {/* Time Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">توزيع ساعات العمل</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">هذا الشهر</span>
                          <span className="text-sm font-semibold">{selectedEmployee.this_month_hours} ساعة</span>
                        </div>
                        <Progress value={selectedEmployee.this_month_hours / 2} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">هذا الأسبوع</span>
                          <span className="text-sm font-semibold">{selectedEmployee.this_week_hours} ساعة</span>
                        </div>
                        <Progress value={(selectedEmployee.this_week_hours / 40) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm">اليوم</span>
                          <span className="text-sm font-semibold">{selectedEmployee.today_hours} ساعة</span>
                        </div>
                        <Progress value={(selectedEmployee.today_hours / 8) * 100} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">مؤشرات الأداء</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">معدل الحضور</span>
                        <span className="font-semibold">{((selectedEmployee.days_worked / 30) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">إنتاجية المبيعات</span>
                        <span className="font-semibold">{(selectedEmployee.total_sales / selectedEmployee.days_worked).toFixed(1)} مبيعة/يوم</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">التقييم العام</span>
                        <Badge variant={selectedEmployee.total_hours > 120 ? "default" : "secondary"}>
                          {selectedEmployee.total_hours > 120 ? "ممتاز" : "جيد"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default EmployeeStatsNew;