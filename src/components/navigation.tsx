"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingCart, Store, Package, BarChart3, Settings, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/contexts/translation-context"

const navigationItems = [
  { key: "home", href: "/", icon: Home, label: "Home" },
  { key: "pos", href: "/pos", icon: ShoppingCart, label: "POS" },
  { key: "stores", href: "/stores", icon: Store, label: "Stores" },
  { key: "items", href: "/items", icon: Package, label: "Items" },
  { key: "reports", href: "/reports", icon: BarChart3, label: "Reports" },
  { key: "settings", href: "/settings", icon: Settings, label: "Settings" },
]

export function Navigation() {
  const { t } = useI18n()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const pathname = usePathname()

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-xl font-bold">
                {t("app.title")}
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const IconComponent = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 px-1 pt-1 text-sm font-medium transition-colors hover:text-primary",
                      isActive 
                        ? "border-b-2 border-primary text-primary" 
                        : "text-muted-foreground"
                    )}
                  >
                    <IconComponent className="size-4" />
                    {t(`navigation.${item.key}`)}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center sm:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground"
                  )}
                >
                  <IconComponent className="size-5" />
                  {t(`navigation.${item.key}`)}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}
