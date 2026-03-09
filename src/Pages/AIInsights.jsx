import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain, Sparkles, AlertTriangle, TrendingUp, CheckCircle2,
  Loader2, RefreshCw, Zap, Lightbulb, Target, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AIInsights() {
  const { data: dashboard, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['aiDashboard'],
    queryFn: () => base44.entities.AIAnalysis.dashboard(),
  });

  useEffect(() => {
    if (isError) {
      toast.error('Failed to load AI Insights dashboard');
    }
  }, [isError]);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Insights updated');
    } catch (err) {
      toast.error('Failed to refresh insights');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto" />
          <p className="text-slate-400 animate-pulse">Analyzing your productivity data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Card className="max-w-md border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Analysis Failed</h3>
            <p className="text-slate-400 mb-6">We couldn't generate insights at this time. Please try again later.</p>
            <Button onClick={() => refetch()} variant="outline" className="border-red-500/20 hover:bg-red-500/10 text-red-400">
              Retry Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, insights, recommendations } = dashboard;
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">AI Insights</h1>
            <p className="text-slate-400">Intelligent productivity analysis for your workspace</p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefetching}
          className="bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all hover:scale-105 active:scale-95"
        >
          {isRefetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh Insights
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm overflow-hidden group hover:border-violet-500/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
                <Target className="h-6 w-6" />
              </div>
              <Badge variant="outline" className="text-violet-400 border-violet-400/30">Live Stats</Badge>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{completionRate}%</p>
            <p className="text-sm text-slate-400 mb-4">Completion Rate</p>
            <Progress value={completionRate} className="h-1.5 bg-slate-800" />
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm group hover:border-red-500/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              {stats.overdue > 0 && <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.overdue}</p>
            <p className="text-sm text-slate-400">Overdue Tasks</p>
            <p className="text-[10px] text-red-400/60 mt-2 font-mono uppercase tracking-wider">Action Required</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm group hover:border-amber-500/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Zap className="h-6 w-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.highPriority}</p>
            <p className="text-sm text-slate-400">High Priority Pending</p>
            <p className="text-[10px] text-amber-400/60 mt-2 font-mono uppercase tracking-wider">Focus Area</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm group hover:border-emerald-500/50 transition-colors">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{stats.completed}</p>
            <p className="text-sm text-slate-400">Tasks Completed</p>
            <p className="text-[10px] text-emerald-400/60 mt-2 font-mono uppercase tracking-wider">Total Impact</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Rule-Based Insights */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400" />
              Strategic Observations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {insights.length === 0 ? (
                <div className="text-center py-10">
                  <Sparkles className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500">No warnings or observations at this time.</p>
                </div>
              ) : (
                insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border transition-all",
                      insight.type === 'critical' ? "bg-red-500/5 border-red-500/20 text-red-200" :
                        insight.type === 'warning' ? "bg-amber-500/5 border-amber-500/20 text-amber-200" :
                          insight.type === 'success' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-200" :
                            "bg-blue-500/5 border-blue-500/20 text-blue-200"
                    )}
                  >
                    <div className="mt-1">
                      {insight.type === 'critical' ? <AlertTriangle className="h-5 w-5 text-red-500" /> :
                        insight.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-amber-500" /> :
                          insight.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> :
                            <Info className="h-5 w-5 text-blue-500" />}
                    </div>
                    <p className="text-sm leading-relaxed">{insight.text}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* LLM Recommendations */}
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="h-24 w-24 text-violet-500" />
          </div>
          <CardHeader className="border-b border-slate-800">
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-400" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="relative pl-8 group">
                  <div className="absolute left-0 top-0 h-full w-px bg-slate-800 group-last:h-5" />
                  <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
                </div>
              ))}

              <div className="pt-4">
                <div className="rounded-xl bg-violet-600/10 border border-violet-500/20 p-4">
                  <div className="flex items-center gap-2 text-violet-400 mb-2">
                    <Brain className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Analysis Model</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Insights generated using TaskPilot Meta-Llama Engine. Data is anonymized for privacy and processed in real-time.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
