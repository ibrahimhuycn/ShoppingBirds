"use client"

import { usePathname } from 'next/navigation';
import { ProtectedRoute } from './ProtectedRoute';

interface ClientAuthWrapperProps {
  children: React.ReactNode;
}

// Pages that don't require authentication
const PUBLIC_ROUTES = ['/login'];

export function ClientAuthWrapper({ children }: ClientAuthWrapperProps) {
  const pathname = usePathname();
  
  // Check if current route is public
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  
  if (isPublicRoute) {
    return <>{children}</>;
  }
  
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}