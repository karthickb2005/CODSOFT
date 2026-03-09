import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Search, Users, UserPlus, Mail, Briefcase, Award, TrendingUp,
  AlertTriangle, Clock, Target, Star, BarChart3, Activity, Brain, Sparkles, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const burnoutColors = {
  low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Healthy' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Moderate' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'High Risk' },
  critical: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Critical' },
};

const roleColors = {
  admin: 'bg-violet-500/20 text-violet-400',
  team_leader: 'bg-blue-500/20 text-blue-400',
  member: 'bg-slate-500/20 text-slate-400',
};

export default function Team() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.TeamMember.list('-created_date'),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const createMemberMutation = useMutation({
    mutationFn: (data) => base44.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setShowMemberDialog(false);
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TeamMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });

  const filteredMembers = members.filter(m =>
    m.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    m.job_title?.toLowerCase().includes(search.toLowerCase())
  );

  const getMemberTasks = (email) => tasks.filter(t => t.assignee_email === email);
  const getMemberCompletedTasks = (email) => getMemberTasks(email).filter(t => t.status === 'done');

  const teamStats = {
    total: members.length,
    active: members.filter(m => m.is_active).length,
    atRisk: members.filter(m => m.burnout_risk === 'high' || m.burnout_risk === 'critical').length,
    avgWorkload: Math.round(members.reduce((acc, m) => acc + (m.current_workload || 0), 0) / (members.length || 1)),
  };

  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    try {
      if (!inviteEmail) {
        toast.error('Please enter an email address');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inviteEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }

      setIsInviting(true);
      await base44.entities.TeamMember.create({
        user_email: inviteEmail,
        role: inviteRole
      });

      setInviteEmail('');
      setShowInviteDialog(false);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      toast.success('Invitation processed!');
    } catch (error) {
      console.error('Failed to send invitation:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send invitation';
      toast.error(errorMsg);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-slate-400 mt-1">
            Manage team members and monitor performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-700" onClick={() => setShowMemberDialog(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Profile
          </Button>
          <Button className="bg-violet-600 hover:bg-violet-700" onClick={() => setShowInviteDialog(true)}>
            <Mail className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20">
              <Users className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{teamStats.total}</p>
              <p className="text-xs text-slate-400">Total Members</p>
            </div>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{teamStats.active}</p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{teamStats.avgWorkload}%</p>
              <p className="text-xs text-slate-400">Avg Workload</p>
            </div>
          </div>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{teamStats.atRisk}</p>
              <p className="text-xs text-slate-400">Burnout Risk</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Search team members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-slate-800/50 border-slate-700"
        />
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map(member => {
          const burnout = burnoutColors[member.burnout_risk] || burnoutColors.low;
          const memberTasks = getMemberTasks(member.user_email);
          const completedTasks = getMemberCompletedTasks(member.user_email);

          return (
            <Card
              key={member.id}
              className="bg-slate-800/50 border-slate-700/50 hover:border-violet-500/50 transition-colors cursor-pointer"
              onClick={() => setSelectedMember(member)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border-2 border-slate-700">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-lg">
                      {member.display_name?.charAt(0) || member.user_email?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">
                        {member.display_name || member.user_email?.split('@')[0]}
                      </h3>
                      <Badge className={cn("text-[10px]", roleColors[member.role])}>
                        {member.role?.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{member.job_title || 'Team Member'}</p>
                    <p className="text-xs text-slate-500 truncate">{member.user_email}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {/* Workload */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Workload</span>
                      <span className={cn(
                        "text-xs font-medium",
                        member.current_workload >= 90 ? "text-rose-400" :
                          member.current_workload >= 70 ? "text-amber-400" : "text-emerald-400"
                      )}>
                        {member.current_workload || 0}%
                      </span>
                    </div>
                    <Progress
                      value={member.current_workload || 0}
                      className={cn(
                        "h-1.5 bg-slate-700",
                        member.current_workload >= 90 && "[&>div]:bg-rose-500",
                        member.current_workload >= 70 && member.current_workload < 90 && "[&>div]:bg-amber-500",
                        member.current_workload < 70 && "[&>div]:bg-emerald-500"
                      )}
                    />
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Target className="w-3 h-3" />
                      <span>{memberTasks.length} tasks</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Award className="w-3 h-3" />
                      <span>{completedTasks.length} done</span>
                    </div>
                    <Badge className={cn("text-[10px]", burnout.bg, burnout.text)}>
                      {burnout.label}
                    </Badge>
                  </div>

                  {/* Skills */}
                  {member.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] border-slate-600">
                          {skill.name}
                        </Badge>
                      ))}
                      {member.skills.length > 3 && (
                        <Badge variant="outline" className="text-[10px] border-slate-600">
                          +{member.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Performance Score */}
                {member.performance_metrics?.productivity_score && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-white">
                        {member.performance_metrics.productivity_score}
                      </span>
                      <span className="text-xs text-slate-400">performance score</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {filteredMembers.length === 0 && (
          <Card className="col-span-full bg-slate-800/50 border-slate-700/50 p-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No team members found</h3>
            <p className="text-slate-400 text-sm">Invite team members to get started</p>
          </Card>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="mt-1.5 bg-slate-800 border-slate-700"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="member">Team Member</SelectItem>
                  <SelectItem value="team_leader">Team Leader</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)} className="border-slate-700">
                Cancel
              </Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                onClick={handleInvite}
                disabled={isInviting}
              >
                {isInviting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Profile Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Add Team Member Profile</DialogTitle>
          </DialogHeader>
          <MemberProfileForm
            onSubmit={(data) => createMemberMutation.mutate(data)}
            onCancel={() => setShowMemberDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Member Detail Dialog */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Team Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <MemberDetailView
              member={selectedMember}
              tasks={getMemberTasks(selectedMember.user_email)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MemberProfileForm({ onSubmit, onCancel, member = null }) {
  const [formData, setFormData] = useState({
    user_email: member?.user_email || '',
    display_name: member?.display_name || '',
    job_title: member?.job_title || '',
    department: member?.department || '',
    role: member?.role || 'member',
    skills: member?.skills || [],
    domains: member?.domains || [],
    availability: member?.availability || { hours_per_week: 40 },
    max_concurrent_tasks: member?.max_concurrent_tasks || 5,
  });
  const [newSkill, setNewSkill] = useState({ name: '', level: 'intermediate' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      organization_id: 'default',
      is_active: true,
      current_workload: 0,
      burnout_risk: 'low',
    });
  };

  const addSkill = () => {
    if (newSkill.name) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill],
      });
      setNewSkill({ name: '', level: 'intermediate' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.user_email}
            onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
            className="mt-1.5 bg-slate-800 border-slate-700"
            required
          />
        </div>
        <div>
          <Label>Display Name</Label>
          <Input
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            className="mt-1.5 bg-slate-800 border-slate-700"
          />
        </div>
        <div>
          <Label>Job Title</Label>
          <Input
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            className="mt-1.5 bg-slate-800 border-slate-700"
          />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
            <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="team_leader">Team Leader</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Skills</Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            placeholder="Skill name"
            className="bg-slate-800 border-slate-700"
          />
          <Select value={newSkill.level} onValueChange={(v) => setNewSkill({ ...newSkill, level: v })}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" onClick={addSkill} className="border-slate-700">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {formData.skills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.skills.map((skill, i) => (
              <Badge key={i} variant="secondary" className="bg-emerald-500/20 text-emerald-300">
                {skill.name} ({skill.level})
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, skills: formData.skills.filter((_, idx) => idx !== i) })}
                  className="ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-slate-700">
          Cancel
        </Button>
        <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
          Save Profile
        </Button>
      </div>
    </form>
  );
}

function MemberDetailView({ member, tasks }) {
  const activeTasks = tasks.filter(t => t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const burnout = burnoutColors[member.burnout_risk] || burnoutColors.low;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 border-2 border-slate-700">
          <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xl">
            {member.display_name?.charAt(0) || member.user_email?.charAt(0)?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold text-white">
            {member.display_name || member.user_email?.split('@')[0]}
          </h2>
          <p className="text-slate-400">{member.job_title || 'Team Member'}</p>
          <p className="text-sm text-slate-500">{member.user_email}</p>
          <div className="flex gap-2 mt-2">
            <Badge className={cn("text-xs", roleColors[member.role])}>
              {member.role?.replace('_', ' ')}
            </Badge>
            <Badge className={cn("text-xs", burnout.bg, burnout.text)}>
              {burnout.label}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50 p-4 text-center">
          <p className="text-2xl font-bold text-white">{member.current_workload || 0}%</p>
          <p className="text-xs text-slate-400">Workload</p>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 p-4 text-center">
          <p className="text-2xl font-bold text-white">{activeTasks.length}</p>
          <p className="text-xs text-slate-400">Active Tasks</p>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50 p-4 text-center">
          <p className="text-2xl font-bold text-white">{completedTasks.length}</p>
          <p className="text-xs text-slate-400">Completed</p>
        </Card>
      </div>

      {member.skills?.length > 0 && (
        <div>
          <h3 className="font-medium text-white mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {member.skills.map((skill, i) => (
              <Badge key={i} variant="outline" className="border-slate-600">
                {skill.name}
                <span className="ml-1 text-slate-500">({skill.level})</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {member.performance_metrics && (
        <div>
          <h3 className="font-medium text-white mb-2">Performance Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">On-Time Rate</p>
              <p className="text-lg font-bold text-white">
                {member.performance_metrics.on_time_rate || 0}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Quality Score</p>
              <p className="text-lg font-bold text-white">
                {member.performance_metrics.avg_quality_score || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Productivity</p>
              <p className="text-lg font-bold text-white">
                {member.performance_metrics.productivity_score || 0}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-800/50">
              <p className="text-xs text-slate-400">Contribution</p>
              <p className="text-lg font-bold text-white">
                {member.performance_metrics.contribution_score || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}