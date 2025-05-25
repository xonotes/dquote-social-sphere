
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Settings, Share, UserPlus, UserMinus, Shield } from 'lucide-react';
import PostCard from '@/components/PostCard';

const ProfilePage = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');

  const isOwnProfile = !username || username === user?.profile.username;
  const profileUsername = username || user?.profile.username;

  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', profileUsername],
    queryFn: async () => {
      if (!profileUsername) throw new Error('No username provided');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', profileUsername)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        throw error;
      }
      return data;
    },
    enabled: !!profileUsername,
    retry: 1
  });

  const { data: stats } = useQuery({
    queryKey: ['profile-stats', profile?.id],
    queryFn: async () => {
      if (!profile) return null;

      const [followersRes, followingRes, postsRes, likesRes] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact' }).eq('following_id', profile.id),
        supabase.from('follows').select('*', { count: 'exact' }).eq('follower_id', profile.id),
        supabase.from('posts').select('*', { count: 'exact' }).eq('user_id', profile.id),
        supabase.from('likes').select('*', { count: 'exact' }).eq('user_id', profile.id)
      ]);

      return {
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
        posts: postsRes.count || 0,
        likes: likesRes.count || 0
      };
    },
    enabled: !!profile
  });

  const { data: isFollowing } = useQuery({
    queryKey: ['is-following', profile?.id],
    queryFn: async () => {
      if (!profile || !user || isOwnProfile) return false;

      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.profile.id)
        .eq('following_id', profile.id)
        .maybeSingle();

      return !!data;
    },
    enabled: !!profile && !!user && !isOwnProfile
  });

  const { data: posts } = useQuery({
    queryKey: ['user-posts', profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (username, display_name, avatar_url, is_verified)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add user like status and counts
      const postsWithData = await Promise.all(
        (data || []).map(async (post) => {
          const [likesRes, commentsRes, userLikeRes] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id),
            user ? supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.profile.id).maybeSingle() : Promise.resolve({ data: null })
          ]);

          return {
            ...post,
            likes_count: likesRes.count || 0,
            comments_count: commentsRes.count || 0,
            user_has_liked: !!userLikeRes.data
          };
        })
      );

      return postsWithData;
    },
    enabled: !!profile
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !user) throw new Error('Missing data');

      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.profile.id)
          .eq('following_id', profile.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.profile.id, following_id: profile.id });
        
        if (error) throw error;

        // Create notification
        await supabase.rpc('create_notification', {
          p_user_id: profile.id,
          p_actor_id: user.profile.id,
          p_type: 'follow'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['is-following'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
      toast({
        title: "Success",
        description: isFollowing ? "Unfollowed successfully" : "Followed successfully"
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

  const blockMutation = useMutation({
    mutationFn: async () => {
      if (!profile || !user) throw new Error('Missing data');

      const { error } = await supabase
        .from('blocks')
        .insert({ blocker_id: user.profile.id, blocked_id: profile.id });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "User blocked",
        description: "You have blocked this user successfully"
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

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profile/${profile?.username}`;
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: "Link copied!",
      description: "Profile link has been copied to clipboard"
    });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white p-4 animate-pulse">
          <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User not found</h2>
          <p className="text-gray-600 mb-4">The profile you're looking for doesn't exist.</p>
          <Link to="/home">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold">{profile.display_name}</h1>
            <p className="text-gray-600 text-sm">@{profile.username}</p>
          </div>
          <div className="flex items-center space-x-2">
            {isOwnProfile ? (
              <Link to="/settings">
                <Button variant="outline" size="sm">
                  <Settings size={16} className="mr-1" />
                  Settings
                </Button>
              </Link>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share size={16} />
                </Button>
                <Button 
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus size={16} className="mr-1" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} className="mr-1" />
                      Follow
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => blockMutation.mutate()}
                  disabled={blockMutation.isPending}
                >
                  <Shield size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 text-2xl font-semibold">
                {profile.display_name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-xl font-bold">{profile.display_name}</h2>
              {profile.is_verified && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-2">@{profile.username}</p>
            {profile.bio && <p className="text-gray-900">{profile.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="font-bold text-lg">{stats?.posts || 0}</div>
            <div className="text-gray-600 text-sm">Posts</div>
          </div>
          <div>
            <div className="font-bold text-lg">{stats?.followers || 0}</div>
            <div className="text-gray-600 text-sm">Followers</div>
          </div>
          <div>
            <div className="font-bold text-lg">{stats?.following || 0}</div>
            <div className="text-gray-600 text-sm">Following</div>
          </div>
          <div>
            <div className="font-bold text-lg">{stats?.likes || 0}</div>
            <div className="text-gray-600 text-sm">Likes</div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-0">
        {!posts || posts.length === 0 ? (
          <div className="text-center py-12 bg-white">
            <p className="text-gray-600">
              {isOwnProfile ? "You haven't posted anything yet." : "No posts to show."}
            </p>
            {isOwnProfile && (
              <Link to="/create" className="mt-4 inline-block">
                <Button>Create your first post</Button>
              </Link>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
