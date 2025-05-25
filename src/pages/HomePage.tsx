
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import StoriesSection from '@/components/StoriesSection';
import RecommendedUsers from '@/components/RecommendedUsers';
import { Skeleton } from '@/components/ui/skeleton';

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
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

  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['home-feed', user?.user.id],
    queryFn: async () => {
      if (!user) return [];

      console.log('Fetching home feed for user:', user.profile.id);

      // Simplified query - get recent posts with basic info
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles!posts_user_id_fkey (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }

      if (!postsData || postsData.length === 0) {
        console.log('No posts found');
        return [];
      }

      console.log('Fetched posts:', postsData.length);

      // Get likes and comments count in parallel
      const postIds = postsData.map(post => post.id);
      
      const [likesData, commentsData, userLikesData] = await Promise.all([
        supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds),
        
        supabase
          .from('comments')
          .select('post_id')
          .in('post_id', postIds),
        
        supabase
          .from('likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', user.profile.id)
      ]);

      // Count likes and comments efficiently
      const likeCounts = (likesData.data || []).reduce((acc, like) => {
        acc[like.post_id] = (acc[like.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commentCounts = (commentsData.data || []).reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const userLikes = new Set((userLikesData.data || []).map(like => like.post_id));

      const enrichedPosts = postsData.map(post => ({
        ...post,
        likes_count: likeCounts[post.id] || 0,
        comments_count: commentCounts[post.id] || 0,
        user_has_liked: userLikes.has(post.id)
      }));

      console.log('Enriched posts:', enrichedPosts.length);
      return enrichedPosts;
    },
    enabled: !!user,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (error) {
    console.error('Home feed error:', error);
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b sticky top-0 z-10 p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">DQUOTE</h1>
        </div>
        <div className="text-center py-12 px-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">Unable to load your feed. Please try again.</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['home-feed'] })}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
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

      {/* Recommended Users */}
      <RecommendedUsers />

      {/* Posts Feed */}
      <div className="space-y-0">
        {isLoading ? (
          <div className="space-y-0">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-3" />
                <div className="flex items-center space-x-6">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : !posts || posts.length === 0 ? (
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
