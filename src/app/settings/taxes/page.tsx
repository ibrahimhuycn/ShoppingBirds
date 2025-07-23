'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Calculator, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TaxManagement } from '@/components/tax';
import { toast } from 'sonner';

export default function TaxesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleTaxesUpdated = (): void => {
    // This function is called when taxes are updated
    // You can add any additional logic here if needed
    console.log('Taxes updated successfully');
  };

  const handleBackToSettings = (): void => {
    router.push('/settings');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBackToSettings}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to Settings
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="size-8" />
            Tax Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure tax types and manage tax settings for your stores
          </p>
        </div>
      </div>

      {/* Tax System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="size-5" />
              Tax Calculation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Uses additive tax calculation method
            </p>
            <div className="text-xs bg-muted p-2 rounded">
              <strong>Example:</strong><br />
              Base Price: $100<br />
              GST 6% + TGST 8% = $14 tax<br />
              Final Price: $114
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="size-5" />
              Tax Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Prices stored tax-exclusive
            </p>
            <div className="text-xs bg-muted p-2 rounded">
              <strong>Benefits:</strong><br />
              • Easy tax rate changes<br />
              • Clear audit trail<br />
              • Flexible reporting
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="size-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Store and item specific taxes
            </p>
            <div className="text-xs bg-muted p-2 rounded">
              <strong>Features:</strong><br />
              • Multiple taxes per item<br />
              • Effective date tracking<br />
              • Active/inactive status
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Management Component */}
      <TaxManagement onTaxesUpdated={handleTaxesUpdated} />

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Using the Tax System</CardTitle>
          <CardDescription>
            Learn how to configure and use taxes in your price management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">1. Configure Tax Types</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Create tax types with appropriate percentages</li>
                <li>• Set one tax type as default (usually "No Tax")</li>
                <li>• Activate/deactivate taxes as needed</li>
                <li>• Use descriptive names (e.g., "GST 6%", "Tourism Tax 8%")</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Assign Taxes to Prices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Go to Items → Select item → Manage Prices</li>
                <li>• Add/edit prices and select applicable taxes</li>
                <li>• Multiple taxes can be applied to one price</li>
                <li>• Preview final price including taxes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Tax Calculation Rules</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All taxes are applied to the base price</li>
                <li>• No compounding (tax on tax)</li>
                <li>• Final Price = Base Price + Sum of all tax amounts</li>
                <li>• Tax amounts are calculated and stored separately</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">4. Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Review tax configurations regularly</li>
                <li>• Test price calculations before going live</li>
                <li>• Use consistent naming conventions</li>
                <li>• Keep historical tax data for reporting</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
