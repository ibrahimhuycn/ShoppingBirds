import type { Database, PriceWithTaxes as DatabasePriceWithTaxes, TaxCalculation as DatabaseTaxCalculation, AppliedTax as DatabaseAppliedTax } from '@/types/database';

// Base tax types from database
export type TaxType = Database['public']['Tables']['tax_types']['Row'];
export type PriceListTax = Database['public']['Tables']['price_list_taxes']['Row'];
export type InvoiceDetailTax = Database['public']['Tables']['invoice_detail_taxes']['Row'];

// Re-export database types for convenience
export type PriceWithTaxes = DatabasePriceWithTaxes;
export type TaxCalculation = DatabaseTaxCalculation;
export type AppliedTax = DatabaseAppliedTax;

// Enhanced tax types with additional functionality
export interface TaxTypeWithStatus extends TaxType {
  associatedPriceListsCount?: number;
  lastUsed?: string | null;
}

export interface TaxAssociation {
  priceListId: number;
  taxTypeId: number;
  taxTypeName: string;
  percentage: number;
  effectiveDate: string;
  isActive: boolean;
}

export interface TaxCalculationResult {
  basePrice: number;
  taxBreakdown: TaxBreakdownItem[];
  totalTaxAmount: number;
  totalTaxPercentage: number;
  finalPrice: number;
  usesDefaultNoTax: boolean;
}

export interface TaxBreakdownItem {
  taxId: number;
  taxName: string;
  percentage: number;
  amount: number;
  effectiveDate: string;
}

export interface PriceWithTaxDisplay {
  priceListId: number;
  itemId: number;
  itemDescription: string;
  storeId: number;
  storeName: string;
  barcode: string;
  basePrice: number;
  taxBreakdown: TaxBreakdownItem[];
  totalTaxAmount: number;
  finalPrice: number;
  currency: string;
  unitName: string;
  unitDescription: string;
  hasCustomTaxes: boolean;
}

// Form types for tax management
export interface TaxFormData {
  name: string;
  description: string;
  percentage: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface TaxAssignmentFormData {
  selectedTaxIds: number[];
  effectiveDate: string;
}

export interface BulkTaxAssignmentData {
  priceListIds: number[];
  taxIds: number[];
  effectiveDate: string;
}

// Component prop types
export interface TaxSelectorProps {
  availableTaxes: TaxType[];
  selectedTaxIds: number[];
  onSelectionChange: (taxIds: number[]) => void;
  disabled?: boolean;
  required?: boolean;
  showCalculatedAmount?: boolean;
  basePrice?: number;
}

export interface TaxBreakdownProps {
  taxBreakdown: TaxBreakdownItem[];
  basePrice: number;
  currency?: string;
  showDetailed?: boolean;
}

export interface TaxManagementProps {
  onTaxesUpdated: () => void;
}

export interface PriceTaxManagerProps {
  priceListId: number;
  basePrice: number;
  currency?: string;
  onTaxesUpdated: () => void;
}

// API response types
export interface TaxApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface TaxValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Tax management actions
export interface TaxActions {
  loadTaxTypes: () => Promise<TaxType[]>;
  createTaxType: (data: TaxFormData) => Promise<TaxType>;
  updateTaxType: (id: number, data: Partial<TaxFormData>) => Promise<TaxType>;
  deleteTaxType: (id: number) => Promise<void>;
  toggleTaxTypeStatus: (id: number, isActive: boolean) => Promise<void>;
  setDefaultTaxType: (id: number) => Promise<void>;
  assignTaxesToPriceList: (priceListId: number, taxIds: number[]) => Promise<void>;
  removeTaxesFromPriceList: (priceListId: number, taxIds: number[]) => Promise<void>;
  bulkAssignTaxes: (data: BulkTaxAssignmentData) => Promise<void>;
  calculateTaxesForPrice: (basePrice: number, taxIds: number[]) => Promise<TaxCalculationResult>;
  validateTaxConfiguration: (taxIds: number[]) => Promise<TaxValidationResult>;
}

// Settings and configuration
export interface TaxSystemSettings {
  defaultTaxCalculationMethod: 'additive' | 'cumulative';
  requireTaxAssignment: boolean;
  allowMultipleTaxes: boolean;
  maxTaxPercentage: number;
  showTaxBreakdownInPOS: boolean;
  showTaxBreakdownInReceipts: boolean;
}

// Reporting types
export interface TaxReportData {
  period: string;
  totalTaxCollected: number;
  taxBreakdownByType: Array<{
    taxTypeName: string;
    taxPercentage: number;
    totalAmount: number;
    transactionCount: number;
  }>;
  averageTaxPercentage: number;
  itemsWithoutTax: number;
  itemsWithTax: number;
}

// Migration and audit types
export interface TaxMigrationResult {
  success: boolean;
  migratedPriceLists: number;
  errors: string[];
  warnings: string[];
}

export interface TaxAuditLog {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ASSIGN' | 'REMOVE';
  targetType: 'TAX_TYPE' | 'PRICE_LIST_TAX';
  targetId: number;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  userId: number | null;
  timestamp: string;
  notes: string | null;
}
