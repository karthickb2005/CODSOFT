import * as React from "react"
import {
    Calendar,
    Home,
    Inbox,
    Search,
    Settings,
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Users,
    BarChart2,
    BrainCircuit,
    Boxes,
    Activity,
    Video
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"

// Menu items.
const items = [
    {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        title: "Projects",
        url: "/projects",
        icon: FolderKanban,
    },
    {
        title: "Tasks",
        url: "/tasks",
        icon: CheckSquare,
    },
    {
        title: "Team",
        url: "/team",
        icon: Users,
    },
    {
        title: "Analytics",
        url: "/analytics",
        icon: BarChart2,
    },
    {
        title: "Activity Feed",
        url: "/activity",
        icon: Activity,
    },
    {
        title: "AI Insights",
        url: "/insights",
        icon: BrainCircuit,
    },
    {
        title: "Workspaces",
        url: "/workspaces",
        icon: Boxes,
    },
    {
        title: "Google Meet",
        url: "http://localhost:5001/api/google/auth",
        icon: Video,
        isExternal: true
    },
    {
        title: "Settings",
        url: "/settings",
        icon: Settings,
    }
]

export function AppSidebar() {
    const location = useLocation();

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <div className="p-4 mb-2">
                        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                            TASKPILOT
                        </h1>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    {item.isExternal ? (
                                        <SidebarMenuButton
                                            onClick={() => window.open(item.url, "_blank")}
                                            className="hover:bg-slate-800 transition-colors"
                                        >
                                            <item.icon className="text-green-500" />
                                            <span>{item.title}</span>
                                        </SidebarMenuButton>
                                    ) : (
                                        <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                                            <Link to={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    )}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
