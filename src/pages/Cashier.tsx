
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatCurrency, printReceipt, generateReceiptHtml } from "@/lib/helpers";
import { fakeDb } from "@/lib/fakeDb";
import { Product, Sale } from "@/lib/types";
import { useToast } from "../hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import {
  CheckCircle2,
  ShoppingCart,
  MinusCircle,
  PlusCircle,
  Printer,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import { InvoicePrint } from "@/components/InvoicePrint";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";

const Cashier = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const { currentUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);

  const { toast } = useToast();

  // Fetch products
  const fetchProducts = async () => {
    try {
      const data = await fakeDb.products.findAll();
      setProducts(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: t("errorLoadingProducts"),
        description: t("failedToLoadProducts"),
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Calculate total based on selected product and quantity
  const calculateTotal = () => {
    if (!selectedProductId) return 0;
    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (!product) return 0;
    
    const subtotal = product.price * quantity;
    const discountAmount = subtotal * ((product.discount || 0) / 100);
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * ((product.tax || 0) / 100);
    const total = afterDiscount + taxAmount;
    
    return total;
  };

  const total = calculateTotal();

  // Get selected product details
  const selectedProduct = selectedProductId
    ? products.find((p) => p.id === parseInt(selectedProductId))
    : null;

  // Handle quantity change
  const handleQuantityChange = (value: number) => {
    if (selectedProduct && value > 0 && value <= selectedProduct.quantity) {
      setQuantity(value);
    }
  };

  // Handle checkout process
  const handleCheckout = async () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: t("errorProcessingSale"),
        description: t("pleaseSelectProduct"),
      });
      return;
    }

    if (quantity <= 0 || quantity > selectedProduct.quantity) {
      toast({
        variant: "destructive",
        title: t("invalidQuantity"),
        description: `${t("pleaseEnterQuantity")} ${selectedProduct.quantity}.`,
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create sale record with discount and tax
      const newSale = await fakeDb.sales.create({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        unitPrice: selectedProduct.price,
        totalPrice: total,
        discount: selectedProduct.discount || 0,
        tax: selectedProduct.tax || 0,
        cashierName: currentUser?.name || "كاشير",
        date: new Date().toISOString()
      });
      
      setCurrentSale(newSale);
      setShowSuccessDialog(true);
      
      // Reset form
      setSelectedProductId("");
      setQuantity(1);
      
      // Refresh products to get updated quantities
      await fetchProducts();
      
      toast({
        title: t("saleCompleted"),
        description: `${t("successfullySold")} ${quantity} ${
          quantity === 1 ? t("unit") : t("units")
        } ${t("of")} ${selectedProduct.name}.`,
      });
    } catch (error) {
      console.error("Error processing sale:", error);
      toast({
        variant: "destructive",
        title: t("saleFailed"),
        description: t("failedToProcessSale"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle printing receipt
  const handlePrintReceipt = () => {
    if (!currentSale) return;
    setShowSuccessDialog(false);
    setShowInvoice(true);
  };

  if (isLoading && products.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("cashierTitle")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("cashierDescription")}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowRight className="ml-2 h-4 w-4 rotate-180" />
          {t("back")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product Selection Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-lg font-medium">{t("newSale")}</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Product Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="product">{t("selectProduct")}</Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectAProduct")} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id.toString()}
                          disabled={product.quantity === 0}
                        >
                          <div className="flex justify-between w-full">
                            <span>
                              {product.name}
                              {product.quantity <= product.lowStockAlert && (
                                <span className="text-amber-500 mr-2 text-xs">
                                  ({t("lowStock")})
                                </span>
                              )}
                            </span>
                            <span className="text-muted-foreground">
                              {product.quantity > 0
                                ? `${product.quantity} ${t("inStock")}`
                                : t("outOfStock")}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity Input with +/- buttons */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t("quantity")}</Label>
                  <div className="flex items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1 || !selectedProductId}
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) =>
                        handleQuantityChange(parseInt(e.target.value))
                      }
                      className="mx-2 text-center"
                      disabled={!selectedProductId}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={
                        !selectedProduct ||
                        quantity >= selectedProduct.quantity
                      }
                    >
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  {selectedProduct && (
                    <p className="text-xs text-muted-foreground">
                      {selectedProduct.quantity} {t("unitsAvailable")}
                    </p>
                  )}
                </div>

                {/* Selected Product Details */}
                {selectedProduct && (
                  <div className="mt-4 p-4 bg-muted rounded-md">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-md">
                        <img
                          src={selectedProduct.imageUrl}
                          alt={selectedProduct.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{selectedProduct.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("price")}: {formatCurrency(selectedProduct.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="w-full flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProductId("");
                    setQuantity(1);
                  }}
                  disabled={!selectedProductId}
                >
                  <RefreshCw className="ml-2 h-4 w-4" />
                  {t("reset")}
                </Button>

                <Button
                  onClick={handleCheckout}
                  disabled={!selectedProductId || quantity <= 0}
                >
                  <ShoppingCart className="ml-2 h-4 w-4" />
                  {t("completeSale")}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Summary Card */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <h3 className="text-lg font-medium">{t("saleSummary")}</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("product")}</span>
                  <span className="font-medium">
                    {selectedProduct ? selectedProduct.name : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("quantity")}</span>
                  <span>{selectedProductId ? quantity : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("unitPrice")}</span>
                  <span>
                    {selectedProduct
                      ? formatCurrency(selectedProduct.price)
                      : "—"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between pt-3">
                  <span className="font-semibold">{t("total")}</span>
                  <span className="font-bold text-xl">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-success" />
              {t("saleCompletedSuccessfully")}
            </DialogTitle>
            <DialogDescription>
              {t("saleProcessedAndInventoryUpdated")}
            </DialogDescription>
          </DialogHeader>
          
          {currentSale && (
            <div className="space-y-3 py-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("product")}:</span>
                <span>{currentSale.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("quantity")}:</span>
                <span>{currentSale.quantity} {t("units")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("total")}:</span>
                <span className="font-bold">
                  {formatCurrency(currentSale.totalPrice)}
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <div className="w-full flex justify-between">
              <Button
                variant="outline"
                onClick={() => setShowSuccessDialog(false)}
              >
                {t("close")}
              </Button>
              <Button onClick={handlePrintReceipt}>
                <Printer className="ml-2 h-4 w-4" />
                {t("printReceipt")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Print */}
      {showInvoice && currentSale && (
        <InvoicePrint
          sale={currentSale}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
    </AppLayout>
  );
};

export default Cashier;
