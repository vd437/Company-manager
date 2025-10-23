import { useEffect, useState } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import { Upload, Save, Clock, DollarSign, FileText, UserPlus, Trash2, Shield, AlertTriangle } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  notes?: string;
  shift_start?: string;
  shift_end?: string;
  base_salary: number;
  role?: string;
  created_at: string;
  updated_at: string;
}

const roleLabels: Record<string, string> = {
  admin: "مدير - صلاحيات كاملة",
  manager: "مدير فرع - إدارة المنتجات والمبيعات",
  cashier: "كاشير - إجراء المبيعات فقط",
  inventory_manager: "مدير مخزون - إدارة المنتجات",
  viewer: "مراقب - عرض فقط",
};

const Employees = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [originalEmployee, setOriginalEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    fullName: "",
    email: "",
    password: "",
    shiftStart: "",
    shiftEnd: "",
    baseSalary: "",
    notes: "",
    role: "cashier",
  });

  // Track unsaved changes
  const hasUnsavedChanges = selectedEmployee && originalEmployee && 
    JSON.stringify(selectedEmployee) !== JSON.stringify(originalEmployee);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees" as any)
        .select(`
          *,
          user_roles!user_roles_user_id_fkey(role)
        `);

      if (error) throw error;
      
      const employeesWithRoles = (data || []).map((emp: any) => ({
        ...emp,
        role: emp.user_roles?.[0]?.role || "viewer",
      }));
      
      setEmployees(employeesWithRoles);
      if (employeesWithRoles.length > 0 && !selectedEmployee) {
        const firstEmployee = employeesWithRoles[0];
        setSelectedEmployee(firstEmployee);
        setOriginalEmployee(JSON.parse(JSON.stringify(firstEmployee)));
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
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("employee-avatars")
        .upload(filePath, avatarFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("employee-avatars")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      return null;
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newEmployee.email,
        password: newEmployee.password,
        options: {
          data: {
            full_name: newEmployee.fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Upload avatar if provided
      const avatarUrl = await uploadAvatar(authData.user.id);

      // Create employee profile
      const { error: employeeError } = await supabase
        .from("employees" as any)
        .insert([{
          user_id: authData.user.id,
          full_name: newEmployee.fullName,
          email: newEmployee.email,
          shift_start: newEmployee.shiftStart || null,
          shift_end: newEmployee.shiftEnd || null,
          base_salary: parseFloat(newEmployee.baseSalary) || 0,
          notes: newEmployee.notes || null,
          avatar_url: avatarUrl,
        }] as any);

      if (employeeError) throw employeeError;

      // Assign role
      const { error: roleError } = await supabase
        .from("user_roles" as any)
        .insert([{
          user_id: authData.user.id,
          role: newEmployee.role as any,
        }] as any);

      if (roleError) throw roleError;

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
      const { error } = await supabase
        .from("employees" as any)
        .update({
          full_name: selectedEmployee.full_name,
          notes: selectedEmployee.notes,
          shift_start: selectedEmployee.shift_start,
          shift_end: selectedEmployee.shift_end,
          base_salary: selectedEmployee.base_salary,
        } as any)
        .eq("id", selectedEmployee.id);

      if (error) throw error;

      // Update role if changed
      if (selectedEmployee.role) {
        // Delete existing role
        await supabase
          .from("user_roles" as any)
          .delete()
          .eq("user_id", selectedEmployee.user_id);
          
        // Insert new role
        const { error: roleError } = await supabase
          .from("user_roles" as any)
          .insert({
            user_id: selectedEmployee.user_id,
            role: selectedEmployee.role as any,
          } as any);

        if (roleError) throw roleError;
      }

      toast({
        title: "تم التحديث بنجاح",
        description: "تم حفظ التغييرات",
      });

      // Update original employee to match saved state
      setOriginalEmployee(JSON.parse(JSON.stringify(selectedEmployee)));
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

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الموظف؟")) return;

    try {
      const { error } = await supabase
        .from("employees" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

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
                    onValueChange={(value) =>
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
                    placeholder=""
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
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      setShowUnsavedDialog(true);
                      setPendingNavigation(emp.id);
                    } else {
                      setSelectedEmployee(emp);
                      setOriginalEmployee(JSON.parse(JSON.stringify(emp)));
                    }
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedEmployee?.id === emp.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={emp.avatar_url} />
                      <AvatarFallback>{emp.full_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{emp.full_name}</p>
                      <p className="text-xs opacity-70">
                        {roleLabels[emp.role || "viewer"]?.split(" - ")[0] || "مراقب"}
                      </p>
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف الموظف
                </Button>
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
                        <AvatarImage src={selectedEmployee.avatar_url} />
                        <AvatarFallback className="text-2xl">
                          {selectedEmployee.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input
                        value={selectedEmployee.full_name}
                        onChange={(e) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            full_name: e.target.value,
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
                          value={selectedEmployee.shift_start || ""}
                          onChange={(e) =>
                            setSelectedEmployee({
                              ...selectedEmployee,
                              shift_start: e.target.value,
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
                          value={selectedEmployee.shift_end || ""}
                          onChange={(e) =>
                            setSelectedEmployee({
                              ...selectedEmployee,
                              shift_end: e.target.value,
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
                    <div className="space-y-2">
                      <Label>
                        <Shield className="inline ml-2 h-4 w-4" />
                        دور الموظف
                      </Label>
                      <Select
                        value={selectedEmployee.role}
                        onValueChange={(value) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            role: value,
                          })
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
                      disabled={isLoading}
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
                        value={selectedEmployee.base_salary}
                        onChange={(e) =>
                          setSelectedEmployee({
                            ...selectedEmployee,
                            base_salary: parseFloat(e.target.value) || 0,
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

        {/* Unsaved Changes Dialog */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                تحذير: تغييرات غير محفوظة
              </AlertDialogTitle>
              <AlertDialogDescription>
                لديك تغييرات غير محفوظة على بيانات الموظف الحالي. إذا تركت هذه الصفحة أو اخترت موظف آخر، سيتم فقدان جميع التغييرات غير المحفوظة.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowUnsavedDialog(false);
                setPendingNavigation(null);
              }}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  // Discard changes
                  if (pendingNavigation) {
                    const emp = employees.find(e => e.id === pendingNavigation);
                    if (emp) {
                      setSelectedEmployee(emp);
                      setOriginalEmployee(JSON.parse(JSON.stringify(emp)));
                    }
                  } else if (originalEmployee) {
                    setSelectedEmployee(JSON.parse(JSON.stringify(originalEmployee)));
                  }
                  setShowUnsavedDialog(false);
                  setPendingNavigation(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                تجاهل التغييرات
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Employees;
