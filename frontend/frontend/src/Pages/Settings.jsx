import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings as SettingsIcon, Building2, Users, Bell, Shield, Palette,
  Globe, Clock, Save, Loader2, Brain, Zap, Mail, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Settings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list(),
  });

  const [orgSettings, setOrgSettings] = useState({
    name: '',
    description: '',
    industry: 'technology',
    timezone: 'UTC',
    work_hours_start: 9,
    work_hours_end: 17,
  });

  const [notifications, setNotifications] = useState({
    email_task_assigned: true,
    email_task_due: true,
    email_mentions: true,
    email_weekly_summary: true,
    app_all: true,
  });

  const [aiSettings, setAiSettings] = useState({
    auto_assign: false,
    auto_schedule: false,
    risk_alerts: true,
    workload_warnings: true,
    performance_insights: true,
  });

  React.useEffect(() => {
    if (organizations.length > 0) {
      const org = organizations[0];
      setOrgSettings({
        name: org.name || '',
        description: org.description || '',
        industry: org.industry || 'technology',
        timezone: org.settings?.timezone || 'UTC',
        work_hours_start: org.settings?.work_hours_start || 9,
        work_hours_end: org.settings?.work_hours_end || 17,
      });
    }
  }, [organizations]);

  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Organization.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setSaving(false);
    },
  });

  const createOrgMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setSaving(false);
    },
  });

  const handleSaveOrg = () => {
    setSaving(true);
    const data = {
      name: orgSettings.name,
      description: orgSettings.description,
      industry: orgSettings.industry,
      owner_email: user?.email,
      settings: {
        timezone: orgSettings.timezone,
        work_hours_start: orgSettings.work_hours_start,
        work_hours_end: orgSettings.work_hours_end,
      },
    };

    if (organizations.length > 0) {
      updateOrgMutation.mutate({ id: organizations[0].id, data });
    } else {
      createOrgMutation.mutate(data);
    }
  };

  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'business', label: 'Business Services' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' },
    { value: 'finance', label: 'Finance' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'other', label: 'Other' },
  ];

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Central European (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan (JST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 mt-1">
          Manage your organization and application preferences
        </p>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="bg-slate-800/50 p-1">
          <TabsTrigger value="organization" className="data-[state=active]:bg-violet-600">
            <Building2 className="w-4 h-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-violet-600">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-violet-600">
            <Brain className="w-4 h-4 mr-2" />
            AI Settings
          </TabsTrigger>
        </TabsList>

        {/* Organization Settings */}
        <TabsContent value="organization">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-violet-400" />
                Organization Settings
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure your organization profile and work preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Organization Name</Label>
                  <Input
                    value={orgSettings.name}
                    onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                    placeholder="Your organization name"
                    className="mt-1.5 bg-slate-800 border-slate-700"
                  />
                </div>
                <div>
                  <Label>Industry</Label>
                  <Select
                    value={orgSettings.industry}
                    onValueChange={(v) => setOrgSettings({ ...orgSettings, industry: v })}
                  >
                    <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {industries.map(i => (
                        <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={orgSettings.description}
                  onChange={(e) => setOrgSettings({ ...orgSettings, description: e.target.value })}
                  placeholder="Brief description of your organization..."
                  className="mt-1.5 bg-slate-800 border-slate-700"
                />
              </div>

              <Separator className="bg-slate-700" />

              <div>
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  Work Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Timezone</Label>
                    <Select
                      value={orgSettings.timezone}
                      onValueChange={(v) => setOrgSettings({ ...orgSettings, timezone: v })}
                    >
                      <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {timezones.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Work Hours Start</Label>
                    <Select
                      value={String(orgSettings.work_hours_start)}
                      onValueChange={(v) => setOrgSettings({ ...orgSettings, work_hours_start: parseInt(v) })}
                    >
                      <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{i}:00</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Work Hours End</Label>
                    <Select
                      value={String(orgSettings.work_hours_end)}
                      onValueChange={(v) => setOrgSettings({ ...orgSettings, work_hours_end: parseInt(v) })}
                    >
                      <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{i}:00</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handleSaveOrg}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-violet-400" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-slate-400">
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-violet-400" />
                  Email Notifications
                </h4>
                <div className="space-y-4">
                  {[
                    { key: 'email_task_assigned', label: 'Task Assignments', desc: 'When a task is assigned to you' },
                    { key: 'email_task_due', label: 'Due Date Reminders', desc: 'Before tasks are due' },
                    { key: 'email_mentions', label: 'Mentions', desc: 'When someone mentions you' },
                    { key: 'email_weekly_summary', label: 'Weekly Summary', desc: 'Weekly progress report' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                      <div>
                        <p className="font-medium text-white">{item.label}</p>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key]}
                        onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div>
                <h4 className="font-medium text-white mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-400" />
                  In-App Notifications
                </h4>
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="font-medium text-white">All Notifications</p>
                    <p className="text-sm text-slate-400">Receive all in-app notifications</p>
                  </div>
                  <Switch
                    checked={notifications.app_all}
                    onCheckedChange={(checked) => setNotifications({ ...notifications, app_all: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-400" />
                TaskPilot AI Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Customize AI-powered features and automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border border-violet-500/30">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/20">
                    <Zap className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">AI-Powered Intelligence</h4>
                    <p className="text-sm text-slate-400 mt-1">
                      TaskPilot AI analyzes your workflow to provide smart recommendations, 
                      predict risks, and optimize team performance automatically.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-white">Automation Settings</h4>
                {[
                  { 
                    key: 'auto_assign', 
                    label: 'Auto-Assignment Suggestions', 
                    desc: 'AI suggests best team member for new tasks',
                    badge: 'Beta'
                  },
                  { 
                    key: 'auto_schedule', 
                    label: 'Smart Scheduling', 
                    desc: 'Automatically optimize task schedules',
                    badge: 'Beta'
                  },
                  { 
                    key: 'risk_alerts', 
                    label: 'Risk Alerts', 
                    desc: 'Get notified about potential delays and bottlenecks'
                  },
                  { 
                    key: 'workload_warnings', 
                    label: 'Workload Warnings', 
                    desc: 'Alert when team members are overloaded'
                  },
                  { 
                    key: 'performance_insights', 
                    label: 'Performance Insights', 
                    desc: 'AI-generated performance analysis and recommendations'
                  },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className={cn(
                        "w-5 h-5 mt-0.5",
                        aiSettings[item.key] ? "text-emerald-400" : "text-slate-600"
                      )} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{item.label}</p>
                          {item.badge && (
                            <Badge className="text-[10px] bg-violet-500/20 text-violet-300">
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={aiSettings[item.key]}
                      onCheckedChange={(checked) => setAiSettings({ ...aiSettings, [item.key]: checked })}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}