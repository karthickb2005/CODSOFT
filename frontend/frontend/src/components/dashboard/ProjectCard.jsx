import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
  planning: { color: 'bg-slate-500', label: 'Planning' },
  active: { color: 'bg-emerald-500', label: 'Active' },
  on_hold: { color: 'bg-amber-500', label: 'On Hold' },
  completed: { color: 'bg-violet-500', label: 'Completed' },
  cancelled: { color: 'bg-rose-500', label: 'Cancelled' },
};

const healthConfig = {
  excellent: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
  good: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: CheckCircle2 },
  at_risk: { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: AlertTriangle },
  critical: { color: 'text-rose-400', bg: 'bg-rose-400/10', icon: AlertTriangle },
};

export default function ProjectCard({ project, onClick }) {
  const health = healthConfig[project.health_status] || healthConfig.good;
  const status = statusConfig[project.status] || statusConfig.active;
  const HealthIcon = health.icon;

  return (
    <Card 
      className="group bg-slate-800/50 border-slate-700/50 hover:border-violet-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={cn("text-[10px] px-2", status.color, "text-white")}>
                {status.label}
              </Badge>
              {project.priority === 'critical' && (
                <Badge variant="secondary" className="text-[10px] px-2 bg-rose-500 text-white">
                  Critical
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-slate-400 line-clamp-2 mt-1">
              {project.description || 'No description'}
            </p>
          </div>
          
          <div className={cn("p-2 rounded-lg", health.bg)}>
            <HealthIcon className={cn("w-4 h-4", health.color)} />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Progress</span>
              <span className="text-xs font-medium text-white">{project.progress || 0}%</span>
            </div>
            <Progress 
              value={project.progress || 0} 
              className="h-1.5 bg-slate-700"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {project.target_end_date ? format(new Date(project.target_end_date), 'MMM d, yyyy') : 'No deadline'}
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5" />
              {project.member_emails?.length || 0} members
            </div>
          </div>

          {project.member_emails?.length > 0 && (
            <div className="flex items-center -space-x-2 pt-2">
              {project.member_emails.slice(0, 4).map((email, i) => (
                <Avatar key={i} className="h-7 w-7 border-2 border-slate-800">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-[10px]">
                    {email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {project.member_emails.length > 4 && (
                <div className="h-7 w-7 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center">
                  <span className="text-[10px] text-slate-300">+{project.member_emails.length - 4}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {project.ai_insights?.delay_probability > 50 && (
        <div className="px-5 py-2 bg-amber-500/10 border-t border-amber-500/20">
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{project.ai_insights.delay_probability}% delay risk detected</span>
          </div>
        </div>
      )}
    </Card>
  );
}