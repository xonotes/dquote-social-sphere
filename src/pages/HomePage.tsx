
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import StoriesSection from '@/components/StoriesSection';
import RecommendedUsers from '@/components/RecommendedUsers';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

const HomePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['home-feed', user?.user.id],
    queryFn: async () => {
      if (!user) return [];

      // Get posts from followed users and own posts
      const { data: followingPosts, error: followingError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (username, display_name, avatar_url, is_verified),
          likes (count),
          comments (count)
        `)
        .in('user_id', [
          user.profile.id,
          ...(await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.profile.id)
            .then(({ data }) => data?.map(f => f.following_id) || []))
        ])
        .order('created_at', { ascending: false })
        .limit(20);

      if (followingError) throw followingError;

      // Add user like status
      const postsWithLikes = await Promise.all(
        (followingPosts || []).map(async (post) => {
          const { data: userLike } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.profile.id)
            .maybeSingle();

          return {
            ...post,
            likes_count: post.likes?.[0]?.count || 0,
            comments_count: post.comments?.[0]?.count || 0,
            user_has_liked: !!userLike
          };
        })
      );

      return postsWithLikes;
    },
    enabled: !!user
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b sticky top-0 z-10 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">DQUOTE</h1>
          <div className="w-8 h-8 bg-blue-100 rounded-full animate-pulse"></div>
        </div>
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
        <h1 className="text-2xl font-bold text-blue-600">DQUOTE</h1>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            {user?.profile.avatar_url ? (
              <img
                src={user.profile.avatar_url}
                alt={user.profile.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-blue-600 text-sm font-semibold">
                {user?.profile.display_name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stories */}
      <StoriesSection />

      {/* Recommended Users for new users */}
      <RecommendedUsers />

      {/* Posts Feed */}
      <div className="space-y-0">
        {!posts || posts.length === 0 ? (
          <div className="text-center py-12 px-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to DQUOTE!</h3>
            <p className="text-gray-600 mb-4">Start following users to see their posts in your feed.</p>
            <p className="text-gray-600">Or create your first post to get started!</p>
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

export default HomePage;
