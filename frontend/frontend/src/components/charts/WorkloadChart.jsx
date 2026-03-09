import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const getBarColor = (workload) => {
  if (workload >= 90) return '#ef4444';
  if (workload >= 70) return '#f59e0b';
  if (workload >= 40) return '#10b981';
  return '#6366f1';
};

export default function WorkloadChart({ members = [] }) {
  const data = members.map(member => ({
    name: member.display_name || member.user_email?.split('@')[0] || 'Unknown',
    workload: member.current_workload || 0,
    tasks: member.active_task_ids?.length || 0,
  })).sort((a, b) => b.workload - a.workload).slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No team data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <XAxis 
          type="number" 
          domain={[0, 100]}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={{ stroke: '#334155' }}
        />
        <YAxis 
          type="category" 
          dataKey="name"
          tick={{ fill: '#e2e8f0', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
          }}
          itemStyle={{ color: '#e2e8f0' }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(value) => [`${value}%`, 'Workload']}
        />
        <Bar dataKey="workload" radius={[0, 4, 4, 0]} barSize={20}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(entry.workload)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}