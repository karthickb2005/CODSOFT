import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  completed: '#10b981',
  in_progress: '#f59e0b',
  todo: '#6366f1',
  backlog: '#64748b',
  review: '#a855f7',
};

export default function ProgressChart({ data, showLegend = true }) {
  const chartData = [
    { name: 'Completed', value: data.completed || 0, color: COLORS.completed },
    { name: 'In Progress', value: data.in_progress || 0, color: COLORS.in_progress },
    { name: 'To Do', value: data.todo || 0, color: COLORS.todo },
    { name: 'Review', value: data.review || 0, color: COLORS.review },
    { name: 'Backlog', value: data.backlog || 0, color: COLORS.backlog },
  ].filter(item => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No data available
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              itemStyle={{ color: '#e2e8f0' }}
              labelStyle={{ color: '#94a3b8' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-[10px] text-slate-400">Tasks</p>
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="space-y-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: item.color }} 
              />
              <span className="text-xs text-slate-400">{item.name}</span>
              <span className="text-xs font-medium text-white ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}