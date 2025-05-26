
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
import { ArrowLeft, Users, FileText, Award, Shield, CheckCircle, XCircle } from 'lucide-react';

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

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersRes, postsRes, verificationsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('posts').select('*', { count: 'exact' }),
        supabase.from('verification_requests').select('*', { count: 'exact' }).eq('status', 'pending')
      ]);

      return {
        totalUsers: usersRes.count || 0,
        totalPosts: postsRes.count || 0,
        pendingVerifications: verificationsRes.count || 0
      };
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats?.totalPosts || 0}</div>
              <div className="text-sm text-gray-600">Total Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{stats?.pendingVerifications || 0}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="verifications">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="users">Recent Users</TabsTrigger>
          </TabsList>

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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
