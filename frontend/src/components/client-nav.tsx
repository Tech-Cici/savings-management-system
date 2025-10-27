"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, History, LogOut } from "lucide-react"

export function ClientNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    // TODO: Clear JWT token and session
    // localStorage.removeItem('token')
    router.push("/client/login")
  }

  const navItems = [
    { href: "/client/dashboard", label: "Dashboard", icon: Home },
    { href: "/client/transactions", label: "Transactions", icon: History },
  ]

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/client/dashboard" className="font-semibold text-lg">
              Savings Manager
            </Link>
            <div className="hidden md:flex items-center gap-4">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 text-sm transition-colors hover:text-accent ${
                      pathname === item.href ? "text-accent" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}
