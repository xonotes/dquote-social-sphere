
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import StoriesSection from '@/components/StoriesSection';

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
  likes: { count: number }[];
  comments: { count: number }[];
  user_has_liked: boolean;
}

const HomePage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      if (!user) return;

      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            display_name,
            avatar_url,
            is_verified
          ),
          likes (count),
          comments (count)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      // Check which posts the user has liked
      const postsWithLikes = await Promise.all(
        posts.map(async (post) => {
          const { data: userLike } = await supabase
            .from('likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.profile.id)
            .single();

          return {
            ...post,
            user_has_liked: !!userLike
          };
        })
      );

      setPosts(postsWithLikes);
      setLoading(false);
    };

    fetchFeed();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">DQUOTE</h1>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-semibold">
              {user?.profile.display_name?.charAt(0) || 'U'}
            </span>
          </div>
        </div>
      </div>

      {/* Stories */}
      <StoriesSection />

      {/* Posts Feed */}
      <div className="space-y-0">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts to show. Follow some users to see their posts!</p>
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
