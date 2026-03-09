import React from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, clearNotifications } = useNotifications();

    return (
        <DropdownMenu onOpenChange={(open) => { if (open && unreadCount > 0) markAsRead(); }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearNotifications}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                            No new notifications
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 focus:bg-slate-100 dark:focus:bg-slate-800">
                                <div className="flex w-full items-center justify-between">
                                    <span className={cn("text-xs font-semibold",
                                        n.eventType === 'taskOverdue' ? 'text-red-500' : 'text-primary'
                                    )}>
                                        {n.eventType === 'taskAssigned' ? 'Task Assigned' :
                                            n.eventType === 'taskStatusChanged' ? 'Status Update' :
                                                'Task Overdue'}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm font-medium">{n.taskTitle}</p>
                                <p className="text-xs text-muted-foreground">
                                    By {n.triggeringUser}
                                </p>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
