import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles, AlertTriangle, TrendingUp, Users, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const insightTypes = {
  task_assignment: { icon: Users, color: 'violet', label: 'Assignment' },
  schedule_optimization: { icon: Clock, color: 'blue', label: 'Scheduling' },
  delay_prediction: { icon: AlertTriangle, color: 'amber', label: 'Risk Alert' },
  workload_balance: { icon: TrendingUp, color: 'emerald', label: 'Workload' },
  burnout_detection: { icon: AlertTriangle, color: 'rose', label: 'Burnout Risk' },
  team_formation: { icon: Users, color: 'indigo', label: 'Team' },
  bottleneck_detection: { icon: AlertTriangle, color: 'orange', label: 'Bottleneck' },
  performance_analysis: { icon: TrendingUp, color: 'teal', label: 'Performance' },
};

const colorClasses = {
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
};

export default function AIInsightCard({ insight, onApply, onDismiss }) {
  const type = insightTypes[insight.analysis_type] || insightTypes.performance_analysis;
  const colors = colorClasses[type.color];
  const Icon = type.icon;

  return (
    <Card className={cn(
      "bg-slate-800/50 border-slate-700/50 overflow-hidden",
      !insight.is_applied && "hover:border-violet-500/30 transition-colors"
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", colors.bg)}>
            <Icon className={cn("w-4 h-4", colors.text)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("text-[10px]", colors.border, colors.text)}>
                {type.label}
              </Badge>
              {insight.results?.confidence && (
                <span className="text-[10px] text-slate-500">
                  {Math.round(insight.results.confidence * 100)}% confidence
                </span>
              )}
              {insight.is_applied && (
                <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Applied
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-white mb-2">{insight.explanation}</p>
            
            {insight.results?.recommendations?.length > 0 && (
              <ul className="space-y-1 mb-3">
                {insight.results.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <Sparkles className="w-3 h-3 mt-0.5 text-violet-400 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            )}
            
            {!insight.is_applied && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs bg-violet-600 hover:bg-violet-700"
                  onClick={() => onApply?.(insight)}
                >
                  Apply Suggestion
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-slate-400 hover:text-white"
                  onClick={() => onDismiss?.(insight)}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}