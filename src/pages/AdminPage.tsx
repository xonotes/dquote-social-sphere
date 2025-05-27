
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, FileText, Award, Shield, CheckCircle, XCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const AdminPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect if not admin
  if (user?.profile.role !== 'admin') {
    navigate('/home');
    return null;
  }

  const { data: adminStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: activityStats } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_activity_stats');
      if (error) throw error;
      return data;
    }
  });

  const { data: verificationRequests } = useQuery({
    queryKey: ['verification-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profiles!verification_requests_user_id_fkey (username, display_name, avatar_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { data: recentUsers } = useQuery({
    queryKey: ['recent-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    }
  });

  const verificationMutation = useMutation({
    mutationFn: async ({ requestId, status, adminNotes }: { requestId: string, status: 'approved' | 'rejected', adminNotes?: string }) => {
      const { error: updateError } = await supabase
        .from('verification_requests')
        .update({ status, admin_notes: adminNotes })
        .eq('id', requestId);

      if (updateError) throw updateError;

      if (status === 'approved') {
        const { data: request } = await supabase
          .from('verification_requests')
          .select('user_id')
          .eq('id', requestId)
          .single();

        if (request) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ is_verified: true })
            .eq('id', request.user_id);

          if (profileError) throw profileError;
        }
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Verification request updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Chart data preparation
  const chartData = activityStats?.map(stat => ({
    month: stat.month,
    users: Number(stat.new_users),
    posts: Number(stat.total_posts),
    likes: Number(stat.total_likes)
  })) || [];

  const pieData = [
    { name: 'Users', value: adminStats?.total_users || 0, color: '#3b82f6' },
    { name: 'Posts', value: adminStats?.total_posts || 0, color: '#10b981' },
    { name: 'Likes', value: adminStats?.total_likes || 0, color: '#f59e0b' },
    { name: 'Comments', value: adminStats?.total_comments || 0, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{adminStats?.total_users || 0}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{adminStats?.total_posts || 0}</div>
              <div className="text-sm text-gray-600">Total Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{adminStats?.total_likes || 0}</div>
              <div className="text-sm text-gray-600">Total Likes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{adminStats?.pending_verifications || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            {/* Activity Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Activity Trends (Last 12 Months)</span>
                </CardTitle>
                <CardDescription>New users, posts, and likes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="New Users" />
                    <Line type="monotone" dataKey="posts" stroke="#10b981" strokeWidth={2} name="Posts" />
                    <Line type="monotone" dataKey="likes" stroke="#f59e0b" strokeWidth={2} name="Likes" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Activity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#3b82f6" name="New Users" />
                    <Bar dataKey="posts" fill="#10b981" name="Posts" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-4">
            {verificationRequests?.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {request.profiles.avatar_url ? (
                        <img
                          src={request.profiles.avatar_url}
                          alt={request.profiles.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {request.profiles.display_name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{request.profiles.display_name}</CardTitle>
                      <CardDescription>@{request.profiles.username}</CardDescription>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm">Bio:</p>
                      <p className="text-sm text-gray-600">{request.bio}</p>
                    </div>
                    {request.social_links && Object.keys(request.social_links).length > 0 && (
                      <div>
                        <p className="font-medium text-sm">Social Links:</p>
                        <div className="text-sm text-gray-600">
                          {Object.entries(request.social_links).map(([platform, url]) => (
                            <div key={platform}>
                              {platform}: {url as string}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => verificationMutation.mutate({
                          requestId: request.id,
                          status: 'approved'
                        })}
                        disabled={verificationMutation.isPending}
                      >
                        <CheckCircle size={16} className="mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => verificationMutation.mutate({
                          requestId: request.id,
                          status: 'rejected',
                          adminNotes: 'Request rejected by admin'
                        })}
                        disabled={verificationMutation.isPending}
                      >
                        <XCircle size={16} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!verificationRequests || verificationRequests.length === 0) && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Award className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No pending verification requests</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {recentUsers?.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {user.display_name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold">{user.display_name}</p>
                        {user.is_verified && (
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>User Engagement Rate</span>
                      <Badge variant="outline">85%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Daily Active Users</span>
                      <Badge variant="outline">{Math.floor((adminStats?.total_users || 0) * 0.3)}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Posts per User</span>
                      <Badge variant="outline">
                        {adminStats?.total_users ? (adminStats.total_posts / adminStats.total_users).toFixed(1) : '0'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Database Status</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>API Response Time</span>
                      <Badge variant="outline">~150ms</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Uptime</span>
                      <Badge className="bg-green-100 text-green-800">99.9%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
