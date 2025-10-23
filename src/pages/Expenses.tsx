import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, DollarSign, TrendingDown, Calendar, User, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Expense } from "@/lib/types";
import AppLayout from "@/components/AppLayout";
import { formatCurrency } from "@/lib/helpers";

const Expenses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [newExpense, setNewExpense] = useState<{
    expense_type: "salary" | "product_cost" | "rent" | "utilities" | "other";
    amount: string;
    description: string;
    employee_id: string;
    product_id: string;
    date: string;
  }>({
    expense_type: "other",
    amount: "",
    description: "",
    employee_id: "",
    product_id: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
    fetchProducts();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses" as any)
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses((data || []) as unknown as Expense[]);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل المصروفات",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees" as any)
        .select("*");

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products" as any)
        .select("*");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error("Error fetching products:", error);
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.amount) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال المبلغ",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const expenseData = {
        expense_type: newExpense.expense_type,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description || null,
        employee_id: newExpense.employee_id || null,
        product_id: newExpense.product_id ? parseInt(newExpense.product_id) : null,
        date: newExpense.date,
        created_by: user.id,
      };

      const { error } = await supabase
        .from("expenses" as any)
        .insert([expenseData] as any);

      if (error) throw error;

      toast({
        title: "تم إضافة المصروف بنجاح",
      });

      setNewExpense({
        expense_type: "other",
        amount: "",
        description: "",
        employee_id: "",
        product_id: "",
        date: new Date().toISOString().split("T")[0],
      });
      setShowAddDialog(false);
      fetchExpenses();
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة المصروف",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getExpenseTypeName = (type: string) => {
    const types: Record<string, string> = {
      salary: "راتب",
      product_cost: "تكلفة منتج",
      rent: "إيجار",
      utilities: "مرافق",
      other: "أخرى",
    };
    return types[type] || type;
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (filterType === "all") return true;
    return expense.expense_type === filterType;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">إدارة المصروفات</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <ArrowRight className="ml-2 h-4 w-4 rotate-180" />
              رجوع
            </Button>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة مصروف
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]" dir="rtl">
                <DialogHeader>
                  <DialogTitle>إضافة مصروف جديد</DialogTitle>
                  <DialogDescription>
                    قم بإدخال بيانات المصروف الجديد
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense_type">نوع المصروف *</Label>
                    <Select
                      value={newExpense.expense_type}
                      onValueChange={(value: any) =>
                        setNewExpense({ ...newExpense, expense_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salary">راتب</SelectItem>
                        <SelectItem value="product_cost">تكلفة منتج</SelectItem>
                        <SelectItem value="rent">إيجار</SelectItem>
                        <SelectItem value="utilities">مرافق</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ (جنيه) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: e.target.value })
                      }
                      placeholder="0.00"
                    />
                  </div>

                  {(newExpense.expense_type === "salary") && (
                    <div className="space-y-2">
                      <Label htmlFor="employee_id">الموظف</Label>
                      <Select
                        value={newExpense.employee_id}
                        onValueChange={(value) =>
                          setNewExpense({ ...newExpense, employee_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر موظف" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(newExpense.expense_type === "product_cost") && (
                    <div className="space-y-2">
                      <Label htmlFor="product_id">المنتج</Label>
                      <Select
                        value={newExpense.product_id}
                        onValueChange={(value) =>
                          setNewExpense({ ...newExpense, product_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر منتج" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((prod) => (
                            <SelectItem key={prod.id} value={prod.id.toString()}>
                              {prod.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="date">التاريخ</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newExpense.date}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, date: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={newExpense.description}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, description: e.target.value })
                      }
                      placeholder="أضف وصف..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleAddExpense}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? "جاري الحفظ..." : "إضافة المصروف"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">عدد المصروفات</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredExpenses.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">فلتر النوع</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="salary">رواتب</SelectItem>
                  <SelectItem value="product_cost">تكاليف منتجات</SelectItem>
                  <SelectItem value="rent">إيجار</SelectItem>
                  <SelectItem value="utilities">مرافق</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>سجل المصروفات</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">النوع</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الوصف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(expense.date).toLocaleDateString("ar-EG")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-secondary">
                        {getExpenseTypeName(expense.expense_type)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-destructive">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {expense.description || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExpenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      لا توجد مصروفات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Expenses;
