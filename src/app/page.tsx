"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Store, Package, BarChart3 } from "lucide-react"
import { useI18n } from "@/contexts/translation-context"
import Link from "next/link"

const quickActions = [
  {
    key: "pos",
    href: "/pos",
    icon: ShoppingCart,
    color: "bg-blue-500",
  },
  {
    key: "stores", 
    href: "/stores",
    icon: Store,
    color: "bg-green-500",
  },
  {
    key: "items",
    href: "/items",
    icon: Package,
    color: "bg-purple-500",
  },
  {
    key: "reports",
    href: "/reports",
    icon: BarChart3,
    color: "bg-orange-500",
  },
]

export default function HomePage() {
  const { t } = useI18n()

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          {t('app.title')}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {t('app.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => {
          const IconComponent = action.icon
          return (
            <Card key={action.href} className="transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className={`inline-flex size-12 items-center justify-center rounded-lg ${action.color}`}>
                  <IconComponent className="size-6 text-white" />
                </div>
                <CardTitle className="text-lg">{t(`${action.key}.title`)}</CardTitle>
                <CardDescription>{t(`${action.key}.scanBarcode`)}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={action.href}>
                    {t('common.next')} {t(`navigation.${action.key}`)}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('common.status')}</CardTitle>
            <CardDescription>System overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Database</span>
                <span className="text-sm text-green-600">{t('common.active')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('navigation.stores')}</span>
                <span className="text-sm text-muted-foreground">1 store</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('navigation.items')}</span>
                <span className="text-sm text-muted-foreground">1 item</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest transactions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">System initialized</p>
                  <p className="text-xs text-muted-foreground">Ready to start processing transactions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
