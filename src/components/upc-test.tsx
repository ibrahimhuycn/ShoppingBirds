// Test component for UPC Edge Function - Add this to a test page if needed
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export function UPCEdgeFunctionTest() {
  const [upc, setUpc] = useState('')
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testEdgeFunction = async () => {
    if (!upc.trim()) return
    
    setIsLoading(true)
    setError(null)
    setResult(null)
    
    try {
      console.log('Testing edge function with UPC:', upc)
      
      const { data, error: functionError } = await supabase.functions.invoke('upc-lookup', {
        body: { upc: upc.trim() }
      })
      
      console.log('Edge function response:', { data, error: functionError })
      
      if (functionError) {
        setError(`Function Error: ${functionError.message}`)
        return
      }
      
      setResult(data)
    } catch (err) {
      console.error('Test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>UPC Edge Function Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={upc}
            onChange={(e) => setUpc(e.target.value)}
            placeholder="Enter UPC (e.g., 0885909950805)"
            className="flex-1"
          />
          <Button onClick={testEdgeFunction} disabled={isLoading || !upc.trim()}>
            {isLoading ? 'Testing...' : 'Test'}
          </Button>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800 text-sm">Error: {error}</p>
          </div>
        )}
        
        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="font-semibold text-green-800 mb-2">Result:</h4>
            <pre className="text-xs text-green-700 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>Test UPC codes:</p>
          <ul className="list-disc list-inside ml-2">
            <li>0885909950805 (Apple iPhone)</li>
            <li>4002293401102 (Sample product)</li>
            <li>012345678912 (12-digit UPC)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

// Usage: Add this to any page to test the edge function
// import { UPCEdgeFunctionTest } from '@/components/upc-test'
// Then use: <UPCEdgeFunctionTest />
