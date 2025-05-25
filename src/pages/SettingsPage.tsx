
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { signOut, updateProfile } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, LogOut, Shield, Award, FileText, Lock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsPage = () => {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [profileData, setProfileData] = useState({
    display_name: user?.profile.display_name || '',
    username: user?.profile.username || '',
    bio: user?.profile.bio || '',
    avatar_url: user?.profile.avatar_url || '',
    is_private: user?.profile.is_private || false
  });

  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Check if username change is allowed (14 days)
      if (profileData.username !== user.profile.username) {
        const lastChange = user.profile.last_username_change;
        if (lastChange) {
          const daysSinceChange = Math.floor(
            (Date.now() - new Date(lastChange).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceChange < 14) {
            throw new Error(`You can change your username again in ${14 - daysSinceChange} days`);
          }
        }

        // Check if username is available
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', profileData.username)
          .neq('id', user.profile.id)
          .maybeSingle();

        if (existingUser) {
          throw new Error('Username is already taken');
        }
      }

      const updates: any = {
        display_name: profileData.display_name,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url || null,
        is_private: profileData.is_private
      };

      if (profileData.username !== user.profile.username) {
        updates.username = profileData.username;
        updates.last_username_change = new Date().toISOString();
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.profile.id);

      if (error) throw error;
    },
    onSuccess: () => {
      refetchUser();
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (passwordData.new !== passwordData.confirm) {
        throw new Error('New passwords do not match');
      }

      if (passwordData.new.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.new
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setPasswordData({ current: '', new: '', confirm: '' });
      toast({
        title: "Success",
        description: "Password changed successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const canChangeUsername = () => {
    if (!user?.profile.last_username_change) return true;
    const daysSinceChange = Math.floor(
      (Date.now() - new Date(user.profile.last_username_change).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceChange >= 14;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="text-gray-600 mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={profileData.display_name}
                onChange={(e) => setProfileData(prev => ({...prev, display_name: e.target.value}))}
                placeholder="Your display name"
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profileData.username}
                onChange={(e) => setProfileData(prev => ({...prev, username: e.target.value}))}
                placeholder="Your username"
                disabled={!canChangeUsername()}
              />
              {!canChangeUsername() && (
                <p className="text-sm text-gray-500 mt-1">
                  You can change your username again in {14 - Math.floor(
                    (Date.now() - new Date(user?.profile.last_username_change || 0).getTime()) / (1000 * 60 * 60 * 24)
                  )} days
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => setProfileData(prev => ({...prev, bio: e.target.value}))}
                placeholder="Tell us about yourself"
                maxLength={500}
              />
            </div>

            <div>
              <Label htmlFor="avatar_url">Avatar URL</Label>
              <Input
                id="avatar_url"
                type="url"
                value={profileData.avatar_url}
                onChange={(e) => setProfileData(prev => ({...prev, avatar_url: e.target.value}))}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_private">Private Account</Label>
                <p className="text-sm text-gray-500">Only followers can see your posts</p>
              </div>
              <Switch
                id="is_private"
                checked={profileData.is_private}
                onCheckedChange={(checked) => setProfileData(prev => ({...prev, is_private: checked}))}
              />
            </div>

            <Button 
              onClick={() => updateProfileMutation.mutate()} 
              disabled={updateProfileMutation.isPending}
              className="w-full"
            >
              {updateProfileMutation.isPending ? 'Updating...' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData(prev => ({...prev, new: e.target.value}))}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData(prev => ({...prev, confirm: e.target.value}))}
                placeholder="Confirm new password"
              />
            </div>

            <Button 
              onClick={() => changePasswordMutation.mutate()} 
              disabled={changePasswordMutation.isPending || !passwordData.new}
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/verification" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                Verification Request
              </Button>
            </Link>

            <Link to="/terms" className="block">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Terms of Service
              </Button>
            </Link>

            <Link to="/privacy" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Policy
              </Button>
            </Link>

            {user?.profile.role === 'admin' && (
              <Link to="/admin" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}

            <Button 
              variant="destructive" 
              onClick={handleSignOut}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
