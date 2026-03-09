import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'increase', 
  icon: Icon, 
  iconColor = 'violet',
  subtitle 
}) {
  const iconColorClasses = {
    violet: 'from-violet-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-600',
    rose: 'from-rose-500 to-pink-600',
    blue: 'from-blue-500 to-cyan-600',
  };

  return (
    <Card className="relative overflow-hidden bg-slate-800/50 border-slate-700/50 p-6">
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
        <div className={cn(
          "w-full h-full rounded-full bg-gradient-to-br opacity-10",
          iconColorClasses[iconColor]
        )} />
      </div>
      
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
          {change !== undefined && (
            <div className="flex items-center gap-1">
              {changeType === 'increase' ? (
                <TrendingUp className="w-3 h-3 text-emerald-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-400" />
              )}
              <span className={cn(
                "text-xs font-medium",
                changeType === 'increase' ? 'text-emerald-400' : 'text-rose-400'
              )}>
                {change}%
              </span>
              <span className="text-xs text-slate-500">vs last week</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className={cn(
            "p-3 rounded-xl bg-gradient-to-br",
            iconColorClasses[iconColor]
          )}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </Card>
  );
}