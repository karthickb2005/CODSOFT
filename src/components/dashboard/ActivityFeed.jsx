import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, Edit, Trash2, UserPlus, UserMinus, ArrowRight, MessageSquare, 
  AtSign, CheckCircle2, RotateCcw, Brain, Sparkles 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const actionConfig = {
  created: { icon: Plus, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  updated: { icon: Edit, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  deleted: { icon: Trash2, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  assigned: { icon: UserPlus, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  unassigned: { icon: UserMinus, color: 'text-slate-400', bg: 'bg-slate-400/10' },
  status_changed: { icon: ArrowRight, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  commented: { icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  mentioned: { icon: AtSign, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  reopened: { icon: RotateCcw, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ai_suggestion: { icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-400/10' },
  ai_assignment: { icon: Brain, color: 'text-violet-400', bg: 'bg-violet-400/10' },
};

export default function ActivityFeed({ activities = [], maxItems = 10 }) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <div className="space-y-1">
      {displayActivities.map((activity, index) => {
        const config = actionConfig[activity.action] || actionConfig.updated;
        const Icon = config.icon;
        
        return (
          <div 
            key={activity.id || index}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors"
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={cn(
                  "text-xs",
                  activity.is_ai_generated 
                    ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white" 
                    : "bg-slate-700 text-slate-300"
                )}>
                  {activity.is_ai_generated ? (
                    <Brain className="w-4 h-4" />
                  ) : (
                    activity.actor_email?.charAt(0).toUpperCase() || '?'
                  )}
                </AvatarFallback>
              </Avatar>
              <div className={cn("absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full", config.bg)}>
                <Icon className={cn("w-2.5 h-2.5", config.color)} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300">
                <span className="font-medium text-white">
                  {activity.is_ai_generated ? 'TaskPilot AI' : activity.actor_email?.split('@')[0] || 'Unknown'}
                </span>
                {' '}
                <span className="text-slate-400">
                  {activity.action.replace(/_/g, ' ')}
                </span>
                {' '}
                <span className="text-slate-200">
                  {activity.entity_type}
                </span>
              </p>
              
              {activity.details?.description && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {activity.details.description}
                </p>
              )}
              
              <p className="text-[10px] text-slate-500 mt-1">
                {formatDistanceToNow(new Date(activity.created_date), { addSuffix: true })}
              </p>
            </div>
          </div>
        );
      })}
      
      {displayActivities.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          No recent activity
        </div>
      )}
    </div>
  );
}