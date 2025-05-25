
import React, { useState } from 'react';
import { Search, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import PostCard from '@/components/PostCard';
import { Skeleton } from '@/components/ui/skeleton';

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['explore-posts', searchQuery],
    queryFn: async () => {
      console.log('Fetching explore posts, search:', searchQuery);

      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          user_id,
          profiles:profiles!posts_user_id_fkey (username, display_name, avatar_url, is_verified)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (searchQuery.trim()) {
        query = query.ilike('content', `%${searchQuery.trim()}%`);
      }

      const { data: postsData, error } = await query;
      if (error) {
        console.error('Error fetching explore posts:', error);
        throw error;
      }

      if (!postsData || postsData.length === 0) {
        return [];
      }

      // Get engagement data efficiently
      const postIds = postsData.map(post => post.id);
      
      const [likesData, commentsData, userLikesData] = await Promise.all([
        supabase.from('likes').select('post_id').in('post_id', postIds),
        supabase.from('comments').select('post_id').in('post_id', postIds),
        user ? supabase.from('likes').select('post_id').in('post_id', postIds).eq('user_id', user.profile.id) : Promise.resolve({ data: [] })
      ]);

      const likeCounts = (likesData.data || []).reduce((acc, like) => {
        acc[like.post_id] = (acc[like.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commentCounts = (commentsData.data || []).reduce((acc, comment) => {
        acc[comment.post_id] = (acc[comment.post_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const userLikes = new Set((userLikesData.data || []).map(like => like.post_id));

      return postsData.map(post => ({
        ...post,
        likes_count: likeCounts[post.id] || 0,
        comments_count: commentCounts[post.id] || 0,
        user_has_liked: userLikes.has(post.id)
      }));
    },
    staleTime: 60000, // Cache for 1 minute
    retry: 1
  });

  const { data: users } = useQuery({
    queryKey: ['explore-users', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      console.log('Searching users:', searchQuery);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified, bio')
        .or(`username.ilike.%${searchQuery.trim()}%,display_name.ilike.%${searchQuery.trim()}%`)
        .eq('is_private', false)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!searchQuery.trim(),
    staleTime: 30000
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Explore</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users and posts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {searchQuery && users && users.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Users</h2>
            <div className="space-y-3">
              {users.map((profile) => (
                <Link 
                  key={profile.id} 
                  to={`/profile/${profile.username}`}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.username} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <User className="h-6 w-6 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1">
                      <span className="font-semibold">{profile.display_name || profile.username}</span>
                      {profile.is_verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">@{profile.username}</p>
                    {profile.bio && <p className="text-gray-700 text-sm mt-1 line-clamp-1">{profile.bio}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-3">
            {searchQuery ? 'Posts' : 'Latest Posts'}
          </h2>
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
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-0">
              {posts && posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-600">
                  {searchQuery ? 'No posts found matching your search.' : 'No posts available.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
