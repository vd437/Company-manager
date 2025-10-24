import { Product, Sale, SalesSummary, TopProduct, User, Employee } from "./types";

// Enhanced database with localStorage persistence
class FakeDB {
  // Private data arrays with underscore prefix to avoid naming conflicts
  private _users: User[] = [];
  private _products: Product[] = [];
  private _sales: Sale[] = [];
  private _employees: Employee[] = [];

  private lastIds = {
    user: 0,
    product: 0,
    sale: 0,
    employee: 0,
  };

  constructor() {
    this.loadFromLocalStorage();
  }

  // Load all data from localStorage
  private loadFromLocalStorage() {
    try {
      const users = localStorage.getItem('db_users');
      const products = localStorage.getItem('db_products');
      const sales = localStorage.getItem('db_sales');
      const employees = localStorage.getItem('db_employees');
      const lastIds = localStorage.getItem('db_lastIds');

      if (users) this._users = JSON.parse(users);
      if (products) this._products = JSON.parse(products);
      if (sales) this._sales = JSON.parse(sales);
      if (employees) this._employees = JSON.parse(employees);
      if (lastIds) this.lastIds = JSON.parse(lastIds);

      // Initialize default admin user if no users exist
      if (this._users.length === 0) {
        const adminUser: User = {
          id: 1,
          name: "المدير",
          email: "admin@example.com",
          password: "admin123",
          role: "admin",
          createdAt: new Date().toISOString(),
        };
        this._users.push(adminUser);
        this.lastIds.user = 1;
        
        // Create corresponding employee record for admin
        const adminEmployee: Employee = {
          id: 1,
          userId: 1,
          fullName: "المدير",
          email: "admin@example.com",
          baseSalary: 0,
          role: "admin",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this._employees.push(adminEmployee);
        this.lastIds.employee = 1;
        
        this.saveToLocalStorage();
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  // Save all data to localStorage
  private saveToLocalStorage() {
    try {
      localStorage.setItem('db_users', JSON.stringify(this._users));
      localStorage.setItem('db_products', JSON.stringify(this._products));
      localStorage.setItem('db_sales', JSON.stringify(this._sales));
      localStorage.setItem('db_employees', JSON.stringify(this._employees));
      localStorage.setItem('db_lastIds', JSON.stringify(this.lastIds));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // Helper to generate random dates for demo data
  private getRandomDate(daysBack: number): string {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString();
  }

  // Authentication
  public auth = {
    login: async (email: string, password: string): Promise<User | null> => {
      const user = this._users.find(
        (u) => u.email === email && u.password === password
      );
      return user || null;
    },

    register: async (userData: Omit<User, "id">): Promise<User> => {
      const id = ++this.lastIds.user;
      const newUser = { ...userData, id };
      this._users.push(newUser);
      this.saveToLocalStorage();
      return newUser;
    },
  };

  // User methods
  public users = {
    findByEmail: async (email: string): Promise<User | null> => {
      const user = this._users.find((u) => u.email === email);
      return user || null;
    },

    findById: async (id: number): Promise<User | null> => {
      const user = this._users.find((u) => u.id === id);
      return user || null;
    },

    create: async (userData: Omit<User, "id">): Promise<User> => {
      const id = ++this.lastIds.user;
      const newUser = { ...userData, id };
      this._users.push(newUser);
      this.saveToLocalStorage();
      return newUser;
    }
  };

  // Product methods
  public products = {
    findAll: async (): Promise<Product[]> => {
      return [...this._products];
    },

    findById: async (id: number): Promise<Product | null> => {
      const product = this._products.find((p) => p.id === id);
      return product || null;
    },

    create: async (
      productData: Omit<Product, "id">
    ): Promise<Product> => {
      const id = ++this.lastIds.product;
      const newProduct = { ...productData, id } as Product;
      this._products.push(newProduct);
      this.saveToLocalStorage();
      return newProduct;
    },

    update: async (
      id: number,
      productData: Omit<Product, "id">
    ): Promise<Product | null> => {
      const index = this._products.findIndex((p) => p.id === id);
      if (index === -1) return null;

      const updatedProduct = { ...productData, id };
      this._products[index] = updatedProduct;
      this.saveToLocalStorage();
      return updatedProduct;
    },

    remove: async (id: number): Promise<boolean> => {
      const initialLength = this._products.length;
      this._products = this._products.filter((p) => p.id !== id);
      this.saveToLocalStorage();
      return this._products.length !== initialLength;
    },

    getLowStock: async (): Promise<Product[]> => {
      return this._products.filter(
        (p) => p.quantity <= p.lowStockAlert && p.quantity > 0
      );
    },

    count: async (): Promise<number> => {
      return this._products.length;
    },

    updateStock: async (
      productId: number,
      quantity: number
    ): Promise<Product | null> => {
      const index = this._products.findIndex((p) => p.id === productId);
      if (index === -1) return null;

      // Update quantity
      const updatedProduct = {
        ...this._products[index],
        quantity: Math.max(0, this._products[index].quantity - quantity),
        updatedAt: new Date().toISOString(),
      };

      this._products[index] = updatedProduct;
      this.saveToLocalStorage();
      return updatedProduct;
    },
  };

  // Sales methods
  public sales = {
    findAll: async (): Promise<Sale[]> => {
      return [...this._sales].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    },

    findById: async (id: number): Promise<Sale | null> => {
      const sale = this._sales.find((s) => s.id === id);
      return sale || null;
    },

    create: async (saleData: Omit<Sale, "id">): Promise<Sale> => {
      const id = ++this.lastIds.sale;
      const newSale = { ...saleData, id };

      // Update product stock
      await this.products.updateStock(saleData.productId, saleData.quantity);

      this._sales.push(newSale);
      this.saveToLocalStorage();
      return newSale;
    },

    getByDateRange: async (
      fromDate: string,
      toDate: string
    ): Promise<Sale[]> => {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      return this._sales
        .filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= from && saleDate <= to;
        })
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    },

    getSummary: async (
      period: "day" | "week" | "month"
    ): Promise<SalesSummary> => {
      const now = new Date();
      let startDate = new Date();

      // Set the start date based on the period
      if (period === "day") {
        startDate.setHours(0, 0, 0, 0);
      } else if (period === "week") {
        startDate.setDate(now.getDate() - 7);
      } else {
        startDate.setMonth(now.getMonth() - 1);
      }

      // Filter sales within the period
      const filteredSales = this._sales.filter(
        (sale) => new Date(sale.date) >= startDate
      );

      // Calculate summary
      const totalSales = filteredSales.length;
      const totalRevenue = filteredSales.reduce(
        (sum, sale) => sum + sale.totalPrice,
        0
      );

      // Get product summary
      const productMap = new Map<number, { name: string; sold: number; revenue: number }>();
      
      filteredSales.forEach((sale) => {
        const existingProduct = productMap.get(sale.productId);
        if (existingProduct) {
          existingProduct.sold += sale.quantity;
          existingProduct.revenue += sale.totalPrice;
        } else {
          productMap.set(sale.productId, {
            name: sale.productName,
            sold: sale.quantity,
            revenue: sale.totalPrice,
          });
        }
      });

      const productSummary = Array.from(productMap.entries()).map(
        ([productId, data]) => ({
          productId,
          productName: data.name,
          totalSold: data.sold,
          totalRevenue: data.revenue,
        })
      );

      return {
        totalSales,
        totalRevenue,
        productSummary,
      };
    },

    getTopProducts: async (limit: number = 5): Promise<TopProduct[]> => {
      // Group sales by product
      const productMap = new Map<number, { name: string; sold: number; revenue: number }>();
      
      this._sales.forEach((sale) => {
        const existingProduct = productMap.get(sale.productId);
        if (existingProduct) {
          existingProduct.sold += sale.quantity;
          existingProduct.revenue += sale.totalPrice;
        } else {
          productMap.set(sale.productId, {
            name: sale.productName,
            sold: sale.quantity,
            revenue: sale.totalPrice,
          });
        }
      });

      // Convert to array and sort by revenue
      const topProducts = Array.from(productMap.entries())
        .map(([productId, data]) => ({
          productId,
          productName: data.name,
          totalSold: data.sold,
          totalRevenue: data.revenue,
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, limit);

      return topProducts;
    },
  };

  // Employee methods
  public employees = {
    findAll: async (): Promise<Employee[]> => {
      return [...this._employees];
    },

    findById: async (id: number): Promise<Employee | null> => {
      const employee = this._employees.find((e) => e.id === id);
      return employee || null;
    },

    findByUserId: async (userId: number): Promise<Employee | null> => {
      const employee = this._employees.find((e) => e.userId === userId);
      return employee || null;
    },

    create: async (
      employeeData: Omit<Employee, "id" | "createdAt" | "updatedAt">
    ): Promise<Employee> => {
      const id = ++this.lastIds.employee;
      const now = new Date().toISOString();
      const newEmployee = {
        ...employeeData,
        id,
        createdAt: now,
        updatedAt: now,
      } as Employee;
      this._employees.push(newEmployee);
      this.saveToLocalStorage();
      return newEmployee;
    },

    update: async (
      id: number,
      employeeData: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">>
    ): Promise<Employee | null> => {
      const index = this._employees.findIndex((e) => e.id === id);
      if (index === -1) return null;

      const employee = this._employees[index];
      
      // CRITICAL: Protect admin user (userId 1) from role changes
      if (employee.userId === 1 && employeeData.role && employeeData.role !== "admin") {
        throw new Error("لا يمكن تغيير صلاحيات المدير الأساسي");
      }

      const updatedEmployee = {
        ...employee,
        ...employeeData,
        updatedAt: new Date().toISOString(),
      };
      this._employees[index] = updatedEmployee;
      
      // Also update the role in the users array if role changed
      if (employeeData.role && employee.userId) {
        const userIndex = this._users.findIndex((u) => u.id === employee.userId);
        if (userIndex !== -1) {
          this._users[userIndex] = {
            ...this._users[userIndex],
            role: employeeData.role,
          };
        }
      }
      
      this.saveToLocalStorage();
      return updatedEmployee;
    },

    remove: async (id: number): Promise<boolean> => {
      const initialLength = this._employees.length;
      this._employees = this._employees.filter((e) => e.id !== id);
      this.saveToLocalStorage();
      return this._employees.length !== initialLength;
    },

    count: async (): Promise<number> => {
      return this._employees.length;
    },
  };
}

export const fakeDb = new FakeDB();
