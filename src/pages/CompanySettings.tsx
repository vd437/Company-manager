import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { Building2, ArrowRight, Upload, Eye } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { useLang } from "@/contexts/LangContext";

interface CompanySettings {
  id?: string;
  company_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
}

interface InvoicePrivacySettings {
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showTaxNumber: boolean;
}

const CompanySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLang();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<CompanySettings>({
    company_name: "شركتي",
  });
  const [privacySettings, setPrivacySettings] = useState<InvoicePrivacySettings>({
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showTaxNumber: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const localData = localStorage.getItem("companySettings");
      if (localData) {
        setSettings(JSON.parse(localData));
      }
      
      const savedPrivacy = localStorage.getItem("invoicePrivacySettings");
      if (savedPrivacy) {
        setPrivacySettings(JSON.parse(savedPrivacy));
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast({
        title: "خطأ في تحميل الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save company settings to localStorage
      localStorage.setItem("companySettings", JSON.stringify(settings));
      
      // Save privacy settings to localStorage
      localStorage.setItem("invoicePrivacySettings", JSON.stringify(privacySettings));

      toast({
        title: "تم حفظ الإعدادات بنجاح",
      });
      
      navigate("/settings");
    } catch (error: any) {
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "خطأ في نوع الملف",
        description: "الرجاء اختيار صورة فقط (PNG, JPG, JPEG, GIF, WEBP)",
        variant: "destructive",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "خطأ في حجم الملف",
        description: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setSettings({ ...settings, logo_url: dataUrl });
        toast({
          title: "تم رفع الشعار بنجاح",
          description: "لا تنسَ حفظ الإعدادات",
        });
        setIsSaving(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "خطأ في رفع الشعار",
        description: error.message || "حدث خطأ أثناء رفع الصورة",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{t("companySettings")}</h1>
            <p className="text-muted-foreground">إدارة معلومات الشركة والشعار</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/settings")}>
            <ArrowRight className="ml-2 h-4 w-4 rotate-180" />
            {t("back")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("companyInfo")}
            </CardTitle>
            <CardDescription>
              أدخل معلومات شركتك التي ستظهر في الفواتير المطبوعة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Company Logo */}
            <div className="space-y-4">
              <Label>شعار الشركة</Label>
              {settings.logo_url && (
                <div className="flex justify-center">
                  <img
                    src={settings.logo_url}
                    alt="Company Logo"
                    className="h-32 w-32 object-contain border rounded-md"
                  />
                </div>
              )}
              <div className="flex justify-center">
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent">
                    <Upload className="h-4 w-4" />
                    <span>{settings.logo_url ? "تغيير الشعار" : "رفع شعار"}</span>
                  </div>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company_name">اسم الشركة *</Label>
              <Input
                id="company_name"
                value={settings.company_name}
                onChange={(e) =>
                  setSettings({ ...settings, company_name: e.target.value })
                }
                placeholder="اسم شركتك"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Textarea
                id="address"
                value={settings.address || ""}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                placeholder="عنوان الشركة"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={settings.phone || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, phone: e.target.value })
                  }
                  placeholder="01XXXXXXXXX"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, email: e.target.value })
                  }
                  placeholder="info@company.com"
                />
              </div>
            </div>

            {/* Tax Number */}
            <div className="space-y-2">
              <Label htmlFor="tax_number">الرقم الضريبي</Label>
              <Input
                id="tax_number"
                value={settings.tax_number || ""}
                onChange={(e) =>
                  setSettings({ ...settings, tax_number: e.target.value })
                }
                placeholder="XXX-XXX-XXX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t("invoicePrivacy")}
            </CardTitle>
            <CardDescription>
              {t("privacyDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="showLogo">{t("showCompanyLogo")}</Label>
              <Switch
                id="showLogo"
                checked={privacySettings.showLogo}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, showLogo: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showAddress">{t("showAddress")}</Label>
              <Switch
                id="showAddress"
                checked={privacySettings.showAddress}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, showAddress: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showPhone">{t("showPhone")}</Label>
              <Switch
                id="showPhone"
                checked={privacySettings.showPhone}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, showPhone: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showEmail">{t("showEmail")}</Label>
              <Switch
                id="showEmail"
                checked={privacySettings.showEmail}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, showEmail: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="showTaxNumber">{t("showTaxNumber")}</Label>
              <Switch
                id="showTaxNumber"
                checked={privacySettings.showTaxNumber}
                onCheckedChange={(checked) =>
                  setPrivacySettings({ ...privacySettings, showTaxNumber: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={isSaving || !settings.company_name}
          className="w-full"
          size="lg"
        >
          {isSaving ? "جاري الحفظ..." : t("save")}
        </Button>
      </div>
    </AppLayout>
  );
};

export default CompanySettings;
