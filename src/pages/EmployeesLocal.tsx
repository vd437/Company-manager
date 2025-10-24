import { useEffect, useState } from "react";
import { Upload, Save, Clock, DollarSign, FileText, UserPlus, Trash2, Shield, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fakeDb } from "@/lib/fakeDb";

interface LocalEmployee {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  avatarUrl?: string;
  notes?: string;
  shiftStart?: string;
  shiftEnd?: string;
  baseSalary: number;
  role?: 'admin' | 'manager' | 'cashier' | 'inventory_manager' | 'viewer';
  createdAt: string;
  updatedAt: string;
}

const roleLabels: Record<string, string> = {
  admin: "مدير - صلاحيات كاملة",
  manager: "مدير فرع - إدارة المنتجات والمبيعات",
  cashier: "كاشير - إجراء المبيعات فقط",
  inventory_manager: "مدير مخزون - إدارة المنتجات",
  viewer: "مراقب - عرض فقط",
};

const EmployeesLocal = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<LocalEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<LocalEmployee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    email: "",
    password: "",
    shiftStart: "",
    shiftEnd: "",
    baseSalary: "",
    notes: "",
    role: "cashier" as const,
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const employeesList = await fakeDb.employees.findAll();
      setEmployees(employeesList);
      if (employeesList.length > 0 && !selectedEmployee) {
        setSelectedEmployee(employeesList[0]);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الموظفين",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Convert to base64 for local storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.fullName || !newEmployee.email || !newEmployee.password) {
      toast({
        title: "خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Create auth user
      const user = await fakeDb.auth.register({
        name: newEmployee.fullName,
        email: newEmployee.email,
        password: newEmployee.password,
        role: newEmployee.role,
        createdAt: new Date().toISOString(),
      });

      // Create employee profile with avatar
      await fakeDb.employees.create({
        userId: user.id,
        fullName: newEmployee.fullName,
        email: newEmployee.email,
        avatarUrl: avatarPreview || undefined,
        shiftStart: newEmployee.shiftStart || undefined,
        shiftEnd: newEmployee.shiftEnd || undefined,
        baseSalary: parseFloat(newEmployee.baseSalary) || 0,
        notes: newEmployee.notes || undefined,
        role: newEmployee.role,
      });

      toast({
        title: "تم إضافة الموظف بنجاح",
        description: "تم إنشاء حساب الموظف وتعيين الصلاحيات",
      });

      setNewEmployee({
        fullName: "",
        email: "",
        password: "",
        shiftStart: "",
        shiftEnd: "",
        baseSalary: "",
        notes: "",
        role: "cashier",
      });
      setAvatarFile(null);
      setAvatarPreview("");
      setShowAddDialog(false);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة الموظف",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    setIsLoading(true);
    try {
      await fakeDb.employees.update(selectedEmployee.id, {
        fullName: selectedEmployee.fullName,
        notes: selectedEmployee.notes,
        shiftStart: selectedEmployee.shiftStart,
        shiftEnd: selectedEmployee.shiftEnd,
        baseSalary: selectedEmployee.baseSalary,
        role: selectedEmployee.role,
      });

      // Update localStorage currentUser if we're updating the currently logged in user
      const currentUserStr = localStorage.getItem("currentUser");
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.id === selectedEmployee.userId) {
          const updatedUser = {
            ...currentUser,
            role: selectedEmployee.role,
          };
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
          
          // Force page reload if user updated their own role
          toast({
            title: "تم التحديث بنجاح",
            description: "سيتم تحديث الصفحة لتطبيق الصلاحيات الجديدة",
          });
          setTimeout(() => window.location.reload(), 1500);
          return;
        }
      }

      toast({
        title: "تم التحديث بنجاح",
        description: "تم حفظ التغييرات",
      });

      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEmployee = async (id: number) => {
    const employee = employees.find(e => e.id === id);
    
    // Protect admin user from deletion
    if (employee?.userId === 1) {
      toast({
        title: "خطأ",
        description: "لا يمكن حذف المدير الأساسي",
        variant: "destructive",
      });
      return;
    }
    
    if (!confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;

    try {
      await fakeDb.employees.remove(id);

      toast({
        title: "تم حذف الموظف بنجاح",
      });
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">إدارة الموظفين</h1>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="ml-2 h-4 w-4" />
                إضافة موظف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh]" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة موظف جديد</DialogTitle>
                <DialogDescription>
                  قم بإدخال بيانات الموظف الجديد وتحديد صلاحياته
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>صورة الموظف</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview} />
                      <AvatarFallback>
                        <Upload className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل *</Label>
                  <Input
                    id="fullName"
                    value={newEmployee.fullName}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, fullName: e.target.value })
                    }
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, email: e.target.value })
                    }
                    placeholder="example@domain.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newEmployee.password}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, password: e.target.value })
                    }
                    placeholder="أدخل كلمة المرور"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">
                    <Shield className="inline ml-2 h-4 w-4" />
                    الصلاحيات *
                  </Label>
                  <Select
                    value={newEmployee.role}
                    onValueChange={(value: any) =>
                      setNewEmployee({ ...newEmployee, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shiftStart">بداية الدوام</Label>
                    <Input
                      id="shiftStart"
                      type="time"
                      value={newEmployee.shiftStart}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, shiftStart: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shiftEnd">نهاية الدوام</Label>
                    <Input
                      id="shiftEnd"
                      type="time"
                      value={newEmployee.shiftEnd}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, shiftEnd: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="baseSalary">المرتب الأساسي (جنيه)</Label>
                  <Input
                    id="baseSalary"
                    type="number"
                    step="0.01"
                    value={newEmployee.baseSalary}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, baseSalary: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Textarea
                    id="notes"
                    value={newEmployee.notes}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, notes: e.target.value })
                    }
                    placeholder="أضف ملاحظات..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleAddEmployee}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="ml-2 h-4 w-4" />
                  {isLoading ? "جاري الحفظ..." : "إضافة الموظف"}
                </Button>
              </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Employees List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>قائمة الموظفين ({employees.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className={`p-3 rounded-lg transition-colors ${
                    selectedEmployee?.id === emp.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="cursor-pointer" onClick={() => setSelectedEmployee(emp)}>
                      <AvatarImage src={emp.avatarUrl} />
                      <AvatarFallback>{emp.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedEmployee(emp)}>
                      <p className="font-medium">{emp.fullName}</p>
                      <p className="text-xs opacity-70">
                        {roleLabels[emp.role || "viewer"]?.split(" - ")[0] || "مراقب"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployee(emp);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {emp.userId !== 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEmployee(emp.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Employee Details */}
          {selectedEmployee && (
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>تفاصيل الموظف</CardTitle>
                {selectedEmployee.userId !== 1 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف الموظف
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="profile" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
                    <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
                    <TabsTrigger value="salary">المرتب</TabsTrigger>
                  </TabsList>

                  <TabsContent value="profile" className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={selectedEmployee.avatarUrl} />
                        <AvatarFallback className="text-2xl">
                          {selectedEmployee.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input
                        value={selectedEmployee.fullName}
                        onChange={(e) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input value={selectedEmployee.email} disabled />
                    </div>

                    <div className="space-y-2">
                      <Label>
                        <FileText className="inline ml-2 h-4 w-4" />
                        ملاحظات
                      </Label>
                      <Textarea
                        value={selectedEmployee.notes || ""}
                        onChange={(e) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            notes: e.target.value,
                          })
                        }
                        rows={4}
                        placeholder="أضف ملاحظات عن الموظف..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          <Clock className="inline ml-2 h-4 w-4" />
                          بداية الدوام
                        </Label>
                        <Input
                          type="time"
                          value={selectedEmployee.shiftStart || ""}
                          onChange={(e) =>
                            setSelectedEmployee({
                              ...selectedEmployee,
                              shiftStart: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>
                          <Clock className="inline ml-2 h-4 w-4" />
                          نهاية الدوام
                        </Label>
                        <Input
                          type="time"
                          value={selectedEmployee.shiftEnd || ""}
                          onChange={(e) =>
                            setSelectedEmployee({
                              ...selectedEmployee,
                              shiftEnd: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleUpdateEmployee}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Save className="ml-2 h-4 w-4" />
                      {isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="permissions" className="space-y-4">
                    {selectedEmployee.userId === 1 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          ⚠️ هذا هو حساب المدير الأساسي ولا يمكن تغيير صلاحياته
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label>
                        <Shield className="inline ml-2 h-4 w-4" />
                        دور الموظف
                      </Label>
                      <Select
                        value={selectedEmployee.role}
                        onValueChange={(value: any) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            role: value,
                          })
                        }
                        disabled={selectedEmployee.userId === 1}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium">شرح الصلاحيات:</h4>
                      <ul className="space-y-2 text-sm">
                        <li>• <strong>مدير:</strong> صلاحيات كاملة لإدارة النظام</li>
                        <li>• <strong>مدير فرع:</strong> إدارة المنتجات والمبيعات والموظفين</li>
                        <li>• <strong>كاشير:</strong> إجراء المبيعات وعرض المنتجات</li>
                        <li>• <strong>مدير مخزون:</strong> إدارة المنتجات والمخزون</li>
                        <li>• <strong>مراقب:</strong> عرض البيانات فقط بدون تعديل</li>
                      </ul>
                    </div>

                    <Button
                      onClick={handleUpdateEmployee}
                      disabled={isLoading || selectedEmployee.userId === 1}
                      className="w-full"
                    >
                      <Save className="ml-2 h-4 w-4" />
                      {isLoading ? "جاري الحفظ..." : "تحديث الصلاحيات"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="salary" className="space-y-4">
                    <div className="space-y-2">
                      <Label>
                        <DollarSign className="inline ml-2 h-4 w-4" />
                        المرتب الأساسي (جنيه)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={selectedEmployee.baseSalary}
                        onChange={(e) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            baseSalary: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>

                    <Button
                      onClick={handleUpdateEmployee}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Save className="ml-2 h-4 w-4" />
                      {isLoading ? "جاري الحفظ..." : "تحديث المرتب"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default EmployeesLocal;