import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/helpers";
import { Sale } from "@/lib/types";

interface CompanySettings {
  company_name: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
}

interface InvoicePrintProps {
  sale: Sale;
  onClose: () => void;
}

export const InvoicePrint = ({ sale, onClose }: InvoicePrintProps) => {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [privacySettings, setPrivacySettings] = useState({
    showLogo: true,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showTaxNumber: true,
  });

  useEffect(() => {
    fetchCompanySettings();
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = () => {
    const saved = localStorage.getItem("invoicePrivacySettings");
    if (saved) {
      setPrivacySettings(JSON.parse(saved));
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const localData = localStorage.getItem("companySettings");
      if (localData) {
        setCompanySettings(JSON.parse(localData));
      }
    } catch (error) {
      console.error("Error fetching company settings:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-2xl mx-auto p-8 bg-white text-black" dir="rtl">
        {/* Company Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
          {privacySettings.showLogo && companySettings?.logo_url && (
            <img
              src={companySettings.logo_url}
              alt="Company Logo"
              className="h-20 mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold mb-2">
            {companySettings?.company_name || "شركتي"}
          </h1>
          {privacySettings.showAddress && companySettings?.address && (
            <p className="text-sm text-gray-600">{companySettings.address}</p>
          )}
          <div className="flex justify-center gap-4 text-sm text-gray-600 mt-2">
            {privacySettings.showPhone && companySettings?.phone && <span>هاتف: {companySettings.phone}</span>}
            {privacySettings.showEmail && companySettings?.email && <span>بريد: {companySettings.email}</span>}
          </div>
          {privacySettings.showTaxNumber && companySettings?.tax_number && (
            <p className="text-sm text-gray-600 mt-1">
              الرقم الضريبي: {companySettings.tax_number}
            </p>
          )}
        </div>

        {/* Invoice Details */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">فاتورة بيع</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">رقم المعاملة</p>
              <p className="font-semibold">{sale.transactionNumber || sale.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">التاريخ</p>
              <p className="font-semibold">
                {new Date(sale.date).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            {sale.cashierName && (
              <div>
                <p className="text-sm text-gray-600">الكاشير</p>
                <p className="font-semibold">{sale.cashierName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-6 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-right py-3 px-2">المنتج</th>
              <th className="text-center py-3 px-2">الكمية</th>
              <th className="text-center py-3 px-2">سعر الوحدة</th>
              <th className="text-left py-3 px-2">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-3 px-2">{sale.productName}</td>
              <td className="text-center py-3 px-2">{sale.quantity}</td>
              <td className="text-center py-3 px-2">{formatCurrency(sale.unitPrice)}</td>
              <td className="text-left py-3 px-2 font-semibold">
                {formatCurrency(sale.unitPrice * sale.quantity)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Pricing Breakdown */}
        <div className="border-t-2 border-gray-300 pt-4 space-y-2">
          {(() => {
            const subtotal = sale.unitPrice * sale.quantity;
            const discountAmount = subtotal * ((sale.discount || 0) / 100);
            const afterDiscount = subtotal - discountAmount;
            const taxAmount = afterDiscount * ((sale.tax || 0) / 100);
            
            return (
              <>
                <div className="flex justify-between items-center text-base">
                  <span>المجموع الفرعي:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                {sale.discount && sale.discount > 0 && (
                  <>
                    <div className="flex justify-between items-center text-base text-green-600">
                      <span>الخصم ({sale.discount}%):</span>
                      <span>- {formatCurrency(discountAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>بعد الخصم:</span>
                      <span>{formatCurrency(afterDiscount)}</span>
                    </div>
                  </>
                )}
                
                {sale.tax && sale.tax > 0 && (
                  <div className="flex justify-between items-center text-base">
                    <span>الضريبة ({sale.tax}%):</span>
                    <span>+ {formatCurrency(taxAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xl font-bold border-t pt-2 mt-2">
                  <span>المجموع الكلي:</span>
                  <span className="text-2xl">{formatCurrency(sale.totalPrice)}</span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>شكراً لتعاملكم معنا</p>
          <p className="mt-2">هذه الفاتورة صادرة من نظام إدارة المبيعات</p>
        </div>

        {/* Print Button (hidden in print) */}
        <div className="no-print mt-6 flex gap-4 justify-center">
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            طباعة الفاتورة
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
