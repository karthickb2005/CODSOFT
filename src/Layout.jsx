import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Outlet } from "react-router-dom"
import { Search } from "lucide-react"
import { NotificationBell } from "./components/notifications/NotificationBell"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Chatbot from "./components/ai/Chatbot"
import { MessageSquare, X } from "lucide-react"
import { useState } from "react"

export default function Layout() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex h-screen w-full flex-col overflow-hidden bg-background">
        {/* Top Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="relative hidden w-80 md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks, projects..."
                className="w-full bg-slate-900/50 pl-9 border-slate-700"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-2.5 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <Avatar className="h-8 w-8 cursor-pointer border border-slate-700">
              <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
              <AvatarFallback>S</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>

        {/* Global Floating AI Chatbot */}
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {isChatOpen && (
            <div className="shadow-2xl rounded-lg overflow-hidden border">
              <Chatbot />
            </div>
          )}
          <Button
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
          </Button>
        </div>
      </main>
    </SidebarProvider>
  )
}
