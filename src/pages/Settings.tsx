import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { Bell, Database, Palette, Moon, Sun, Languages, DollarSign, Building2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    lowStockAlerts: true,
    currency: "EGP",
    taxRate: "14",
    language: "ar",
    theme: "light",
  });
  const [companySettings, setCompanySettings] = useState<any>(null);

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem("appSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    // Load company settings
    const savedCompany = localStorage.getItem("companySettings");
    if (savedCompany) {
      setCompanySettings(JSON.parse(savedCompany));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم حفظ التغييرات بنجاح",
    });
  };

  const handleToggleNotifications = () => {
    const newValue = !settings.notifications;
    setSettings({ ...settings, notifications: newValue });
    toast({
      title: newValue ? "تم تفعيل الإشعارات" : "تم إيقاف الإشعارات",
      description: newValue ? "سيتم استقبال إشعارات النظام" : "لن يتم استقبال إشعارات النظام",
    });
  };

  const handleToggleEmailAlerts = () => {
    const newValue = !settings.emailAlerts;
    setSettings({ ...settings, emailAlerts: newValue });
    toast({
      title: newValue ? "تم تفعيل إشعارات البريد الإلكتروني" : "تم إيقاف إشعارات البريد الإلكتروني",
    });
  };

  const handleToggleLowStockAlerts = () => {
    const newValue = !settings.lowStockAlerts;
    setSettings({ ...settings, lowStockAlerts: newValue });
    toast({
      title: newValue ? "تم تفعيل تنبيهات المخزون المنخفض" : "تم إيقاف تنبيهات المخزون المنخفض",
    });
  };

  const handleChangeCurrency = (value: string) => {
    setSettings({ ...settings, currency: value });
    toast({
      title: "تم تغيير العملة",
      description: `العملة الآن: ${value}`,
    });
  };

  const handleChangeTaxRate = (value: string) => {
    setSettings({ ...settings, taxRate: value });
    toast({
      title: "تم تحديث نسبة الضريبة",
      description: `نسبة الضريبة: ${value}%`,
    });
  };

  const handleChangeLanguage = (value: string) => {
    setSettings({ ...settings, language: value });
    toast({
      title: "تم تغيير اللغة",
      description: value === "ar" ? "العربية" : "English",
    });
  };

  const handleChangeTheme = (value: string) => {
    setSettings({ ...settings, theme: value });
    const themeText = value === "light" ? "فاتح" : value === "dark" ? "داكن" : "تلقائي";
    toast({
      title: "تم تغيير المظهر",
      description: `المظهر: ${themeText}`,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة إعدادات النظام العامة</p>
        </div>

        <div className="grid gap-6">
          {/* Company Settings Link */}
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate("/company-settings")}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {companySettings?.logo_url && (
                    <img 
                      src={companySettings.logo_url} 
                      alt="Company Logo" 
                      className="h-10 w-10 object-contain rounded"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {companySettings?.company_name || "إعدادات الشركة"}
                    </div>
                    {companySettings?.company_name && (
                      <p className="text-sm text-muted-foreground font-normal mt-1">
                        انقر لتعديل معلومات الشركة
                      </p>
                    )}
                  </div>
                </div>
                <ArrowLeft className="h-5 w-5" />
              </CardTitle>
              {!companySettings && (
                <CardDescription>إدارة معلومات الشركة والشعار الذي يظهر في الفواتير</CardDescription>
              )}
            </CardHeader>
          </Card>

          {/* Notifications Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                الإشعارات
              </CardTitle>
              <CardDescription>إدارة إعدادات الإشعارات والتنبيهات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base font-medium">تفعيل الإشعارات</Label>
                  <p className="text-sm text-muted-foreground">
                    استقبال إشعارات النظام
                  </p>
                </div>
                <Button
                  variant={settings.notifications ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleNotifications}
                >
                  <Bell className="ml-2 h-4 w-4" />
                  {settings.notifications ? "مُفعّل" : "غير مُفعّل"}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base font-medium">إشعارات البريد الإلكتروني</Label>
                  <p className="text-sm text-muted-foreground">
                    استقبال التنبيهات عبر البريد الإلكتروني
                  </p>
                </div>
                <Button
                  variant={settings.emailAlerts ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleEmailAlerts}
                >
                  <Bell className="ml-2 h-4 w-4" />
                  {settings.emailAlerts ? "مُفعّل" : "غير مُفعّل"}
                </Button>
              </div>

              <div className="flex items-center justify-between gap-4 p-4 rounded-lg border bg-card">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base font-medium">تنبيهات المخزون المنخفض</Label>
                  <p className="text-sm text-muted-foreground">
                    إشعارات عند انخفاض كمية المنتجات
                  </p>
                </div>
                <Button
                  variant={settings.lowStockAlerts ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleLowStockAlerts}
                >
                  <Bell className="ml-2 h-4 w-4" />
                  {settings.lowStockAlerts ? "مُفعّل" : "غير مُفعّل"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                إعدادات العمل
              </CardTitle>
              <CardDescription>إعدادات المتجر والعملات والضرائب</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  <Label className="text-base font-medium">العملة</Label>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={settings.currency}
                    onValueChange={handleChangeCurrency}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EGP">جنيه مصري (EGP)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                      <SelectItem value="EUR">يورو (EUR)</SelectItem>
                      <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleChangeCurrency(settings.currency)}
                  >
                    تطبيق
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-3">
                <Label className="text-base font-medium">نسبة الضريبة (%)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                    placeholder="14"
                    className="flex-1"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleChangeTaxRate(settings.taxRate)}
                  >
                    تحديث
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                المظهر
              </CardTitle>
              <CardDescription>إعدادات المظهر واللغة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  <Label className="text-base font-medium">اللغة</Label>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={settings.language}
                    onValueChange={handleChangeLanguage}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ar">العربية</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleChangeLanguage(settings.language)}
                  >
                    تطبيق
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  {settings.theme === "dark" ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                  <Label className="text-base font-medium">المظهر</Label>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={settings.theme}
                    onValueChange={handleChangeTheme}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">فاتح</SelectItem>
                      <SelectItem value="dark">داكن</SelectItem>
                      <SelectItem value="system">تلقائي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleChangeTheme(settings.theme)}
                  >
                    تطبيق
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleSave} className="w-full" size="lg">
                <Palette className="ml-2 h-5 w-5" />
                حفظ جميع الإعدادات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
