"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ReceiptText,
  Truck,
  Users,
  UserRound,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  teams: [
    {
      name: "ShopDash",
      logo: Package,
      plan: "Admin",
    },
  ],
  navMain: [
    {
      title: "Overview",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Products",
      url: "/dashboard/products",
      icon: Package,
    },
    {
      title: "POS Terminal",
      url: "/dashboard/pos",
      icon: ShoppingCart,
    },
    {
      title: "Orders / Sales",
      url: "/dashboard/orders",
      icon: ReceiptText,
    },
    {
      title: "Customers",
      url: "/dashboard/customers",
      icon: UserRound,
    },
    {
      title: "Suppliers",
      url: "/dashboard/suppliers",
      icon: Users,
    },
    {
      title: "Purchases",
      url: "/dashboard/purchases",
      icon: Truck,
    },
    {
      title: "Expenses",
      url: "/dashboard/expenses",
      icon: ReceiptText, // Or another suitable icon
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
