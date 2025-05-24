
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Share, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import PostCard from '@/components/PostCard';

interface ProfileStats {
  followers_count: number;
  following_count: number;
  posts_count: number;
  likes_count: number;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    followers_count: 0,
    following_count: 0,
    posts_count: 0,
    likes_count: 0
  });
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      // Fetch stats
      const [followersRes, followingRes, postsRes] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact' })
          .eq('following_id', user.profile.id),
        supabase
          .from('follows')
          .select('id', { count: 'exact' })
          .eq('follower_id', user.profile.id),
        supabase
          .from('posts')
          .select('id', { count: 'exact' })
          .eq('user_id', user.profile.id)
      ]);

      // Fetch user posts
      const { data: userPosts } = await supabase
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
        .eq('user_id', user.profile.id)
        .order('created_at', { ascending: false });

      // Calculate total likes
      const { data: likesData } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .in('post_id', userPosts?.map(p => p.id) || []);

      setStats({
        followers_count: followersRes.count || 0,
        following_count: followingRes.count || 0,
        posts_count: postsRes.count || 0,
        likes_count: likesData?.count || 0
      });

      if (userPosts) {
        const postsWithLikes = await Promise.all(
          userPosts.map(async (post) => {
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
      }

      setLoading(false);
    };

    fetchProfileData();
  }, [user]);

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profile/${user?.profile.username}`;
    navigator.clipboard.writeText(profileUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">{user?.profile.display_name}</h1>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share size={20} />
          </Button>
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <Settings size={20} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white p-6 space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
            {user?.profile.avatar_url ? (
              <img 
                src={user.profile.avatar_url} 
                alt={user.profile.username}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 text-2xl font-semibold">
                {user?.profile.display_name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold">{user?.profile.display_name}</h2>
              {user?.profile.is_verified && (
                <CheckCircle size={20} className="text-blue-500" />
              )}
            </div>
            <p className="text-gray-600">@{user?.profile.username}</p>
            {user?.profile.bio && (
              <p className="text-gray-800 mt-2">{user.profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around py-4 border-t border-gray-200">
          <div className="text-center">
            <div className="font-bold text-lg">{stats.followers_count}</div>
            <div className="text-gray-600 text-sm">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{stats.following_count}</div>
            <div className="text-gray-600 text-sm">Following</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{stats.posts_count}</div>
            <div className="text-gray-600 text-sm">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">{stats.likes_count}</div>
            <div className="text-gray-600 text-sm">Likes</div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="mt-2 space-y-0">
        {posts.length === 0 ? (
          <div className="bg-white p-8 text-center">
            <p className="text-gray-500">No posts yet. Share your first post!</p>
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
