"use client"

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showEmergencyOption, setShowEmergencyOption] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Safety net: Show emergency options after extended loading
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setShowEmergencyOption(true);
      }, 15000); // Show after 15 seconds of loading

      return () => clearTimeout(timer);
    } else {
      setShowEmergencyOption(false);
    }
  }, [isLoading]);

  const handleEmergencyLogin = () => {
    // Clear all auth data and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-[350px]">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin mb-4" />
            <p className="text-muted-foreground mb-4">Loading...</p>
            
            {showEmergencyOption && (
              <div className="flex flex-col items-center space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2 text-amber-600">
                  <AlertCircle className="size-4" />
                  <span className="text-sm">Taking longer than expected</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleEmergencyLogin}
                  className="text-xs"
                >
                  Clear session and go to login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will redirect to login
  }

  return <>{children}</>;
}