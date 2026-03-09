import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, AlertCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
  backlog: { icon: Circle, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  todo: { icon: Circle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  in_progress: { icon: Loader2, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  review: { icon: Clock, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  done: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  cancelled: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
};

const priorityConfig = {
  low: { color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  medium: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  high: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  urgent: { color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
};

export default function TaskItem({ task, onClick, compact = false }) {
  const status = statusConfig[task.status] || statusConfig.todo;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;
  
  const isOverdue = task.due_date && task.status !== 'done' && isBefore(new Date(task.due_date), new Date());
  const isDueSoon = task.due_date && task.status !== 'done' && !isOverdue && isBefore(new Date(task.due_date), addDays(new Date(), 2));

  if (compact) {
    return (
      <div 
        className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors"
        onClick={onClick}
      >
        <div className={cn("p-1.5 rounded", status.bg)}>
          <StatusIcon className={cn("w-3.5 h-3.5", status.color, task.status === 'in_progress' && 'animate-spin')} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {task.due_date && (
              <span className={cn(
                "text-xs",
                isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-slate-500'
              )}>
                {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
          </div>
        </div>
        {task.assignee_email && (
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[10px]">
              {task.assignee_email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }

  return (
    <div 
      className="group p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/50 cursor-pointer transition-all"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", status.bg)}>
          <StatusIcon className={cn("w-4 h-4", status.color, task.status === 'in_progress' && 'animate-spin')} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors">
              {task.title}
            </h4>
            <Badge variant="outline" className={cn("text-[10px] shrink-0", priority.color)}>
              {task.priority}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-xs text-slate-400 line-clamp-2 mb-3">{task.description}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {task.due_date && (
                <div className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? 'text-rose-400' : isDueSoon ? 'text-amber-400' : 'text-slate-500'
                )}>
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.due_date), 'MMM d')}
                </div>
              )}
              {task.estimated_hours && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  {task.estimated_hours}h
                </div>
              )}
            </div>
            
            {task.assignee_email && (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[10px]">
                  {task.assignee_email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>

      {task.ai_schedule?.delay_risk > 50 && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertCircle className="w-3 h-3" />
            <span>AI: {task.ai_schedule.delay_risk}% delay risk</span>
          </div>
        </div>
      )}
    </div>
  );
}