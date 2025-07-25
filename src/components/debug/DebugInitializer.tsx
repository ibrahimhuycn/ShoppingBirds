"use client"

import { useEffect } from 'react';
import { initializeDebugUtils } from '@/lib/debug-auth';

export function DebugInitializer() {
  useEffect(() => {
    initializeDebugUtils();
  }, []);

  return null; // This component doesn't render anything
}