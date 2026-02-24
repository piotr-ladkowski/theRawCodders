import * as React from "react"
import {
  IconMap2,
  IconActivity,
  IconSend,
  IconBackpack,
  IconUsersGroup,
  IconTools,
  IconFileAi,
  IconSettings,
} from "@tabler/icons-react"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"

const data = {
  navMain: [
    {
      title: "Command Center",
      url: "/dashboard/main",
      icon: IconMap2,
    },
    {
      title: "Incidents",
      url: "/dashboard/incidents",
      icon: IconActivity,
    },
    {
      title: "Dispatches",
      url: "/dashboard/dispatches",
      icon: IconSend,
    },
    {
      title: "Equipment",
      url: "/dashboard/equipment",
      icon: IconBackpack,
    },
    {
      title: "Personnel",
      url: "/dashboard/personnel",
      icon: IconUsersGroup,
    },
    {
      title: "Maintenance",
      url: "/dashboard/maintenance",
      icon: IconTools,
    },
    {
      title: "AI Insights",
      url: "/dashboard/insights",
      icon: IconFileAi,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useQuery(api.auth.currentUser);
  const user = {
    email: currentUser?.email ?? "sampleemail",
    name: currentUser?.name ?? "user",
    image: currentUser?.image ?? ""
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 hover:bg-inherit"
            >
              <Link to="/">
                <span className="text-base font-semibold">Rescue Command Base</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}