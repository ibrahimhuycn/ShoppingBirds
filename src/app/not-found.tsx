"use client"

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { useI18n } from '@/contexts/translation-context';

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-6xl font-bold text-muted-foreground">404</CardTitle>
          <CardDescription className="text-lg">{t('errors.notFound')}</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {t('errors.notFoundDescription')}
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="/">
                <Home className="size-4 mr-2" />
                {t('errors.goHome')}
              </Link>
            </Button>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="size-4 mr-2" />
              {t('errors.goBack')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
