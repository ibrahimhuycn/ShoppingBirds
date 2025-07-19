"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Star, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getActiveCurrencies,
  createCurrency,
  updateCurrency,
  type Currency,
  type CurrencyInsert,
  type CurrencyUpdate,
} from "@/lib/currency";

interface CurrencyFormData {
  code: string;
  name: string;
  symbol: string;
  factor: number;
  isBaseCurrency: boolean;
  decimalPlaces: number;
  isActive: boolean;
}

const defaultFormData: CurrencyFormData = {
  code: "",
  name: "",
  symbol: "",
  factor: 1.0,
  isBaseCurrency: false,
  decimalPlaces: 2,
  isActive: true,
};

export default function CurrenciesPage() {
  const router = useRouter();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [formData, setFormData] = useState<CurrencyFormData>(defaultFormData);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const loadCurrencies = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const currencyList = await getActiveCurrencies();
      setCurrencies(currencyList);
    } catch (error) {
      console.error("Failed to load currencies:", error);
      toast.error("Failed to load currencies");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCurrencies();
  }, []);

  const handleOpenDialog = (currency?: Currency): void => {
    if (currency) {
      setEditingCurrency(currency);
      setFormData({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        factor: currency.factor,
        isBaseCurrency: currency.isBaseCurrency,
        decimalPlaces: currency.decimalPlaces,
        isActive: currency.isActive,
      });
    } else {
      setEditingCurrency(null);
      setFormData(defaultFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (): void => {
    setIsDialogOpen(false);
    setEditingCurrency(null);
    setFormData(defaultFormData);
  };

  const handleInputChange = (field: keyof CurrencyFormData, value: string | number | boolean): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast.error("Currency code is required");
      return false;
    }
    if (!formData.name.trim()) {
      toast.error("Currency name is required");
      return false;
    }
    if (!formData.symbol.trim()) {
      toast.error("Currency symbol is required");
      return false;
    }
    if (formData.factor <= 0) {
      toast.error("Exchange rate factor must be greater than 0");
      return false;
    }
    return true;
  };

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      if (editingCurrency) {
        // Update existing currency
        const updateData: CurrencyUpdate = {
          code: formData.code.toUpperCase(),
          name: formData.name,
          symbol: formData.symbol,
          factor: formData.factor,
          isBaseCurrency: formData.isBaseCurrency,
          decimalPlaces: formData.decimalPlaces,
          isActive: formData.isActive,
        };
        await updateCurrency(editingCurrency.id, updateData);
        toast.success("Currency updated successfully");
      } else {
        // Create new currency
        const insertData: CurrencyInsert = {
          code: formData.code.toUpperCase(),
          name: formData.name,
          symbol: formData.symbol,
          factor: formData.factor,
          isBaseCurrency: formData.isBaseCurrency,
          decimalPlaces: formData.decimalPlaces,
          isActive: formData.isActive,
        };
        await createCurrency(insertData);
        toast.success("Currency created successfully");
      }

      handleCloseDialog();
      await loadCurrencies();
    } catch (error) {
      console.error("Failed to save currency:", error);
      toast.error("Failed to save currency");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (currency: Currency): Promise<void> => {
    try {
      await updateCurrency(currency.id, {
        isActive: !currency.isActive,
      });
      toast.success(`Currency ${currency.isActive ? 'deactivated' : 'activated'} successfully`);
      await loadCurrencies();
    } catch (error) {
      console.error("Failed to toggle currency status:", error);
      toast.error("Failed to update currency status");
    }
  };

  const formatFactor = (factor: number): string => {
    return factor.toFixed(4);
  };

  const baseCurrency = currencies.find(c => c.isBaseCurrency);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button 
          onClick={() => router.push('/settings')} 
          className="flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Settings
        </button>
        <span>/</span>
        <span>Currency Management</span>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Currency Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage currencies and exchange rates for your system
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="size-4 mr-2" />
              Add Currency
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingCurrency ? "Edit Currency" : "Add New Currency"}
              </DialogTitle>
              <DialogDescription>
                {editingCurrency
                  ? "Update the currency details below."
                  : "Add a new currency to your system."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code *
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                  className="col-span-3"
                  placeholder="USD"
                  maxLength={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="col-span-3"
                  placeholder="US Dollar"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="symbol" className="text-right">
                  Symbol *
                </Label>
                <Input
                  id="symbol"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange("symbol", e.target.value)}
                  className="col-span-3"
                  placeholder="$"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="factor" className="text-right">
                  Rate *
                </Label>
                <Input
                  id="factor"
                  type="number"
                  step="0.0001"
                  value={formData.factor}
                  onChange={(e) => handleInputChange("factor", parseFloat(e.target.value) || 0)}
                  className="col-span-3"
                  placeholder="1.0000"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="decimalPlaces" className="text-right">
                  Decimals
                </Label>
                <Input
                  id="decimalPlaces"
                  type="number"
                  min="0"
                  max="8"
                  value={formData.decimalPlaces}
                  onChange={(e) => handleInputChange("decimalPlaces", parseInt(e.target.value) || 0)}
                  className="col-span-3"
                  placeholder="2"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isBaseCurrency" className="text-right">
                  Base Currency
                </Label>
                <input
                  id="isBaseCurrency"
                  type="checkbox"
                  checked={formData.isBaseCurrency}
                  onChange={(e) => handleInputChange("isBaseCurrency", e.target.checked)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Active
                </Label>
                <input
                  id="isActive"
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange("isActive", e.target.checked)}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {baseCurrency && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5 text-yellow-500" />
              Base Currency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-2xl">{baseCurrency.symbol}</span>
              <div>
                <p className="font-semibold">{baseCurrency.name} ({baseCurrency.code})</p>
                <p className="text-sm text-muted-foreground">
                  All other currencies are converted relative to this base currency
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Currencies</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading currencies...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Exchange Rate</TableHead>
                  <TableHead>Decimals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currencies.map((currency) => (
                  <TableRow key={currency.id}>
                    <TableCell className="font-medium">{currency.code}</TableCell>
                    <TableCell>{currency.name}</TableCell>
                    <TableCell className="text-lg">{currency.symbol}</TableCell>
                    <TableCell>{formatFactor(currency.factor)}</TableCell>
                    <TableCell>{currency.decimalPlaces}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {currency.isActive ? (
                          <CheckCircle className="size-4 text-green-500" />
                        ) : (
                          <XCircle className="size-4 text-red-500" />
                        )}
                        <span>{currency.isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {currency.isBaseCurrency && (
                        <Star className="size-4 text-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(currency)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(currency)}
                          disabled={currency.isBaseCurrency}
                        >
                          {currency.isActive ? (
                            <XCircle className="size-4" />
                          ) : (
                            <CheckCircle className="size-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exchange Rate Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>Exchange Rate Factor:</strong> The conversion rate from this currency to the base currency.</p>
            <p><strong>Example:</strong> If USD is base (factor 1.0) and EUR has factor 0.85, then 1 EUR = 0.85 USD.</p>
            <p><strong>Decimal Places:</strong> Number of decimal places to show (USD: 2, JPY: 0).</p>
            <p><strong>Base Currency:</strong> All conversions and reports use this as the reference currency.</p>
            <p className="text-muted-foreground mt-4">
              💡 Tip: Update exchange rates regularly or integrate with a currency API for automatic updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
