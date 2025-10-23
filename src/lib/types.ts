
// Add the missing type definitions or update existing ones

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "admin" | "cashier";
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  cost: number;
  quantity: number;
  lowStockAlert: number;
  discount?: number;
  tax?: number;
  productNumber?: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  transactionNumber?: string;
  cashierName?: string;
  date: string;
  discount?: number;
  tax?: number;
}

export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  productSummary: ProductSummary[];
}

export interface ProductSummary {
  productId: number;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface DashboardSummary {
  today: {
    totalSales: number;
    totalRevenue: number;
    productSummary: ProductSummary[];
  };
  week: {
    totalSales: number;
    totalRevenue: number;
    productSummary: ProductSummary[];
  };
  month: {
    totalSales: number;
    totalRevenue: number;
    productSummary: ProductSummary[];
  };
  topProducts: TopProduct[];
  lowStockProducts: Product[];
  productCount: number;
}

export interface TopProduct {
  productId: number;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface Employee {
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

export interface Expense {
  id: string;
  expense_type: 'salary' | 'product_cost' | 'rent' | 'utilities' | 'other';
  amount: number;
  description?: string;
  employee_id?: string;
  product_id?: number;
  date: string;
  created_by: string;
  created_at: string;
}
