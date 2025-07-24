"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, ShoppingCart, Store, Package, Receipt, BarChart3, Settings, Menu, X, LogOut, KeyRound, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useI18n } from "@/contexts/translation-context"
import { useAuth } from "@/contexts/auth-context"
import { ChangePasswordDialog } from "@/components/auth"

const navigationItems = [
  { key: "home", href: "/", icon: Home, label: "Home" },
  { key: "pos", href: "/pos", icon: ShoppingCart, label: "POS" },
  { key: "stores", href: "/stores", icon: Store, label: "Stores" },
  { key: "items", href: "/items", icon: Package, label: "Items" },
  { key: "transactions", href: "/transactions", icon: Receipt, label: "Transactions" },
  { key: "reports", href: "/reports", icon: BarChart3, label: "Reports" },
  { key: "users", href: "/users", icon: Users, label: "Users" },
  { key: "settings", href: "/settings", icon: Settings, label: "Settings" },
]

export function Navigation() {
  const { t } = useI18n()
  const { user, logout, isAuthenticated } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const [showChangePassword, setShowChangePassword] = useState<boolean>(false)
  const pathname = usePathname()
  const router = useRouter()

  // Debug logging
  console.log('Navigation Debug:', { isAuthenticated, user, pathname })

  const toggleMobileMenu = (): void => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleLogout = (): void => {
    logout()
    router.push('/login')
  }

  const getUserInitials = (fullName: string): string => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  // Don't show navigation on login page or if not authenticated
  if (!isAuthenticated || pathname === '/login') {
    return null
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
          <div className="flex items-center">
            {/* Desktop User Menu */}
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors">
                  {user ? getUserInitials(user.fullName) : 'U'}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      @{user?.username}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} variant="destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Mobile Menu Button */}
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
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            {/* User info in mobile */}
            <div className="border-b pb-3 mb-3">
              <div className="flex items-center px-3 py-2">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user ? getUserInitials(user.fullName) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground">@{user?.username}</p>
                </div>
              </div>
            </div>
            
            {/* Navigation items */}
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
            
            {/* User actions in mobile */}
            <div className="border-t pt-3 mt-3">
              <button
                onClick={() => {
                  setShowChangePassword(true)
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center gap-2 px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full"
              >
                <KeyRound className="size-5" />
                Change Password
              </button>
              <button
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center gap-2 px-3 py-2 text-base font-medium text-destructive hover:bg-destructive/10 hover:text-destructive w-full"
              >
                <LogOut className="size-5" />
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
    </nav>
  )
}