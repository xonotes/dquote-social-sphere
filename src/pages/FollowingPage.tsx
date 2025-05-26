
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, UserMinus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const FollowingPage = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!username
  });

  const { data: following, isLoading } = useQuery({
    queryKey: ['following', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (
            id, username, display_name, avatar_url, is_verified, bio
          )
        `)
        .eq('follower_id', profile.id);
      
      if (error) throw error;
      return data?.map(item => item.profiles).filter(Boolean) || [];
    },
    enabled: !!profile
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user!.profile.id)
        .eq('following_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast({
        title: "Success",
        description: "Unfollowed successfully"
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

  const isOwnProfile = user?.profile.username === username;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${username}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Following</h1>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${username}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Following</h1>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {following && following.length > 0 ? (
          following.map((followedUser: any) => (
            <div 
              key={followedUser.id}
              className="flex items-center space-x-3 p-3 bg-white rounded-lg border"
            >
              <Link to={`/profile/${followedUser.username}`} className="flex items-center space-x-3 flex-1">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  {followedUser.avatar_url ? (
                    <img src={followedUser.avatar_url} alt={followedUser.username} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold">{followedUser.display_name || followedUser.username}</span>
                    {followedUser.is_verified && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">@{followedUser.username}</p>
                  {followedUser.bio && <p className="text-gray-700 text-sm mt-1 line-clamp-1">{followedUser.bio}</p>}
                </div>
              </Link>
              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => unfollowMutation.mutate(followedUser.id)}
                  disabled={unfollowMutation.isPending}
                >
                  <UserMinus size={16} className="mr-1" />
                  Unfollow
                </Button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-600">
            Not following anyone yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowingPage;
