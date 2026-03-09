import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Activity, Clock, User as UserIcon, CheckCircle2,
    AlertTriangle, ArrowRight, Loader2, Info, Layout
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const actionMap = {
    'TASK_CREATED': { icon: CheckCircle2, color: 'text-emerald-400', label: 'Task Created' },
    'TASK_UPDATED': { icon: Activity, color: 'text-blue-400', label: 'Task Updated' },
    'TASK_DELETED': { icon: AlertTriangle, color: 'text-red-400', label: 'Task Deleted' },
    'PROJECT_CREATED': { icon: Layout, color: 'text-violet-400', label: 'Project Created' },
    'USER_LOGIN': { icon: UserIcon, color: 'text-emerald-400', label: 'User Login' },
    'USER_LOGOUT': { icon: UserIcon, color: 'text-slate-400', label: 'User Logout' },
};

export default function ActivityFeed() {
    const { data, isLoading } = useQuery({
        queryKey: ['activityFeed'],
        queryFn: () => base44.integrations.Activity.feed(),
    });

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        );
    }

    const logs = data?.logs || [];

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-xl bg-violet-600/20 text-violet-400">
                    <Activity className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Activity Timeline</h1>
                    <p className="text-slate-400">A complete audit log of all workspace events</p>
                </div>
            </div>

            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                {logs.map((log) => {
                    const action = actionMap[log.action] || { icon: Info, color: 'text-slate-400', label: log.action };
                    const Icon = action.icon;

                    return (
                        <div key={log._id} className="relative flex items-start gap-6 group">
                            {/* Icon Circle */}
                            <div className={cn(
                                "absolute left-0 mt-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 border border-slate-700 transition-transform group-hover:scale-110",
                                action.color
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>

                            {/* Content Card */}
                            <Card className="ml-14 bg-slate-900/40 border-slate-800 backdrop-blur-sm flex-1 hover:border-slate-700 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white uppercase tracking-tight text-xs">{action.label}</span>
                                            <Badge variant="outline" className="text-[10px] bg-slate-800 border-slate-700">
                                                {log.entity_type}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(log.createdAt), 'MMM d, h:mm a')}
                                        </div>
                                    </div>

                                    <p className="text-sm text-slate-300">
                                        <span className="font-semibold text-violet-400">{log.actor_email === 'System' ? 'System' : log.actor_email}</span>
                                        {log.action === 'TASK_CREATED' && " created a new task."}
                                        {log.action === 'TASK_UPDATED' && " updated a task."}
                                        {log.action === 'TASK_DELETED' && " deleted a task."}
                                        {log.action === 'PROJECT_CREATED' && " initialized a new project."}
                                        {log.action === 'USER_LOGIN' && " logged into the platform."}
                                    </p>

                                    {log.metadata?.after?.title && (
                                        <div className="mt-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 flex items-center justify-between group/item">
                                            <span className="text-sm font-medium text-slate-200">{log.metadata.after.title}</span>
                                            <ArrowRight className="h-4 w-4 text-slate-600 transition-transform group-hover/item:translate-x-1" />
                                        </div>
                                    )}

                                    {log.ip_address && (
                                        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-4">
                                            <span className="text-[10px] text-slate-600 font-mono">IP: {log.ip_address}</span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}

                {logs.length === 0 && (
                    <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                        <Activity className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500">No activity recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
