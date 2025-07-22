"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencySelector, MoneyDisplay, MoneyInput } from "@/components/currency";
import { getBaseCurrency, convertCurrency } from "@/lib/currency";
import { toast } from "sonner";

export default function CurrencyTestPage() {
  const [selectedCurrency, setSelectedCurrency] = useState<number | undefined>();
  const [moneyAmount, setMoneyAmount] = useState<{ amount: number; currencyId: number } | undefined>();
  const [conversionResult, setConversionResult] = useState<{
    fromAmount: number;
    fromCurrencyId: number;
    toAmount: number;
    toCurrencyId: number;
  } | undefined>();

  const handleTestConversion = async (): Promise<void> => {
    if (!moneyAmount) {
      toast.error("Please enter an amount first");
      return;
    }

    try {
      const baseCurrency = await getBaseCurrency();
      const conversion = await convertCurrency(
        moneyAmount.amount,
        moneyAmount.currencyId,
        baseCurrency.id
      );

      setConversionResult({
        fromAmount: moneyAmount.amount,
        fromCurrencyId: moneyAmount.currencyId,
        toAmount: conversion.convertedAmount,
        toCurrencyId: baseCurrency.id,
      });

      toast.success("Conversion completed successfully");
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error("Failed to convert currency");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Currency System Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the new currency management system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Currency Selector Test */}
        <Card>
          <CardHeader>
            <CardTitle>Currency Selector</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Currency:</label>
              <CurrencySelector
                value={selectedCurrency}
                onValueChange={setSelectedCurrency}
                placeholder="Choose a currency"
                className="mt-2"
              />
            </div>
            {selectedCurrency && (
              <p className="text-sm text-muted-foreground">
                Selected Currency ID: {selectedCurrency}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Money Input Test */}
        <Card>
          <CardHeader>
            <CardTitle>Money Input</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Enter Amount:</label>
              <MoneyInput
                value={moneyAmount}
                onValueChange={setMoneyAmount}
                placeholder="Enter amount"
                defaultCurrencyId={1} // USD
                className="mt-2"
              />
            </div>
            {moneyAmount && (
              <div className="text-sm text-muted-foreground">
                <p>Amount: {moneyAmount.amount}</p>
                <p>Currency ID: {moneyAmount.currencyId}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Money Display Test */}
        <Card>
          <CardHeader>
            <CardTitle>Money Display</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Sample Amounts:</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>USD:</span>
                  <MoneyDisplay amount={1234.56} currencyId={1} />
                </div>
                <div className="flex justify-between">
                  <span>EUR:</span>
                  <MoneyDisplay amount={999.99} currencyId={2} />
                </div>
                <div className="flex justify-between">
                  <span>JPY:</span>
                  <MoneyDisplay amount={150000} currencyId={4} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Conversion Test */}
        <Card>
          <CardHeader>
            <CardTitle>Currency Conversion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleTestConversion} 
              disabled={!moneyAmount}
              className="w-full"
            >
              Convert to Base Currency
            </Button>
            
            {conversionResult && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <h4 className="font-medium">Conversion Result:</h4>
                <div className="flex justify-between">
                  <span>From:</span>
                  <MoneyDisplay 
                    amount={conversionResult.fromAmount} 
                    currencyId={conversionResult.fromCurrencyId}
                  />
                </div>
                <div className="flex justify-between">
                  <span>To:</span>
                  <MoneyDisplay 
                    amount={conversionResult.toAmount} 
                    currencyId={conversionResult.toCurrencyId}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <h4 className="font-medium">What's been implemented:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>✅ Currencies table with proper normalization</li>
              <li>✅ Foreign key relationships to currencies table</li>
              <li>✅ Base currency system with conversion factors</li>
              <li>✅ TypeScript service layer for currency operations</li>
              <li>✅ Reusable UI components for currency selection and display</li>
              <li>✅ Money input component with currency symbol display</li>
              <li>✅ Currency conversion utilities</li>
              <li>✅ Proper decimal place handling per currency</li>
            </ul>
            
            <h4 className="font-medium mt-4">Old hardcoded currency locations fixed:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>✅ items.currency → items.currency_id (FK)</li>
              <li>✅ price_history.currency → price_history.currency_id (FK)</li>
              <li>✅ price_lists.currency → price_lists.currency_id (FK)</li>
              <li>✅ price_change_history currencies → proper FK relationships</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
