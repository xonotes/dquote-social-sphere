
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, TrendingUp, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PostCard from '@/components/PostCard';
import RecommendedUsers from '@/components/RecommendedUsers';
import { Link } from 'react-router-dom';

const ExplorePage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Get trending posts (most liked in last 24 hours)
  const { data: trendingPosts } = useQuery({
    queryKey: ['trending-posts'],
    queryFn: async () => {
      if (!user) return [];

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (username, display_name, avatar_url, is_verified)
        `)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Add like counts and user interaction data
      const postsWithData = await Promise.all(
        (data || []).map(async (post) => {
          const [likesRes, commentsRes, userLikeRes] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', post.id),
            supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.profile.id).maybeSingle()
          ]);

          return {
            ...post,
            likes_count: likesRes.count || 0,
            comments_count: commentsRes.count || 0,
            user_has_liked: !!userLikeRes.data
          };
        })
      );

      // Sort by likes count
      return postsWithData.sort((a, b) => b.likes_count - a.likes_count);
    },
    enabled: !!user
  });

  // Get random profiles for discovery
  const { data: randomProfiles } = useQuery({
    queryKey: ['random-profiles'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.profile.id)
        .limit(10);

      if (error) throw error;

      // Shuffle the profiles
      return data?.sort(() => Math.random() - 0.5) || [];
    },
    enabled: !!user
  });

  // Search functionality
  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { posts: [], users: [] };

      const [postsRes, usersRes] = await Promise.all([
        supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey (username, display_name, avatar_url, is_verified)
          `)
          .ilike('content', `%${searchQuery}%`)
          .limit(10),
        supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(10)
      ]);

      const postsWithData = await Promise.all(
        (postsRes.data || []).map(async (post) => {
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

      return {
        posts: postsWithData,
        users: usersRes.data || []
      };
    },
    enabled: !!searchQuery.trim()
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="p-4">
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search posts and users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Explore
            </h1>
            <div className="flex items-center space-x-2">
              <TrendingUp className="text-orange-500" size={20} />
              <span className="text-sm font-medium text-gray-600">Trending</span>
            </div>
          </div>
        </div>
      </div>

      {searchQuery.trim() ? (
        /* Search Results */
        <div className="p-4">
          <Tabs defaultValue="posts">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-0 mt-4">
              {searchResults?.posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
              {searchResults?.posts.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No posts found for "{searchQuery}"</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="users" className="mt-4">
              <div className="space-y-3">
                {searchResults?.users.map((profile) => (
                  <div key={profile.id} className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Link to={`/profile/${profile.username}`}>
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt={profile.username}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 font-semibold">
                                {profile.display_name?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div>
                          <div className="flex items-center space-x-1">
                            <Link to={`/profile/${profile.username}`}>
                              <span className="font-semibold hover:underline">
                                {profile.display_name}
                              </span>
                            </Link>
                            {profile.is_verified && (
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <Link to={`/profile/${profile.username}`}>
                            <span className="text-gray-600 text-sm hover:underline">
                              @{profile.username}
                            </span>
                          </Link>
                          {profile.bio && (
                            <p className="text-sm text-gray-700 mt-1">{profile.bio}</p>
                          )}
                        </div>
                      </div>
                      <Button size="sm">Follow</Button>
                    </div>
                  </div>
                ))}
                {searchResults?.users.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No users found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        /* Default Explore Content */
        <div>
          {/* Discover Users Section */}
          <div className="bg-white border-b p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Users className="text-blue-500" size={20} />
                <h2 className="font-semibold">Discover People</h2>
              </div>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {randomProfiles?.slice(0, 8).map((profile) => (
                <div key={profile.id} className="flex flex-col items-center space-y-2 flex-shrink-0">
                  <Link to={`/profile/${profile.username}`}>
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.username}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          {profile.display_name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="text-sm font-medium max-w-16 truncate">
                        {profile.display_name}
                      </span>
                      {profile.is_verified && (
                        <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 max-w-16 truncate block">
                      @{profile.username}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Users */}
          <RecommendedUsers />

          {/* Trending Posts */}
          <div className="space-y-0">
            {trendingPosts?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {(!trendingPosts || trendingPosts.length === 0) && (
              <div className="text-center py-12 bg-white">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No trending posts at the moment</p>
                <p className="text-sm text-gray-500">Check back later for trending content</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
