
import React, { useState } from 'react';
import { Search, User, Heart, MessageCircle, Share } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import PostCard from '@/components/PostCard';

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['explore-posts', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:profiles!posts_user_id_fkey (username, display_name, avatar_url, is_verified),
          likes (count),
          comments (count)
        `)
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      // Add user like status
      const postsWithLikes = await Promise.all(
        (data || []).map(async (post) => {
          const { data: userLike } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user?.profile.id || '')
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
    }
  });

  const { data: users } = useQuery({
    queryKey: ['explore-users', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .eq('is_private', false)
        .limit(10);

      if (error) throw error;
      return data;
    }
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
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:bg-gray-50"
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
                    {profile.bio && <p className="text-gray-700 text-sm mt-1">{profile.bio}</p>}
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
            <div className="space-y-4">
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
          ) : (
            <div className="space-y-0">
              {posts?.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
