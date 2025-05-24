
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Share, User, Heart, MessageCircle, Edit3, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const ProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch user's posts
  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', user?.user.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          likes (id),
          comments (id)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  // Fetch user stats
  const { data: stats } = useQuery({
    queryKey: ['user-stats', user?.user.id],
    queryFn: async () => {
      if (!user) return { followers: 0, following: 0, totalPosts: 0, totalLikes: 0 };
      
      const [followersRes, followingRes, postsRes] = await Promise.all([
        supabase
          .from('follows')
          .select('id')
          .eq('following_id', user.user.id),
        supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.user.id),
        supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.user.id)
      ]);

      // Calculate total likes across all user's posts
      const { data: likesData } = await supabase
        .from('likes')
        .select('id, post_id')
        .in('post_id', postsRes.data?.map(p => p.id) || []);

      return {
        followers: followersRes.data?.length || 0,
        following: followingRes.data?.length || 0,
        totalPosts: postsRes.data?.length || 0,
        totalLikes: likesData?.length || 0
      };
    },
    enabled: !!user
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      toast.success('Post deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete post');
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { error } = await supabase
        .from('posts')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', postId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      setEditingPost(null);
      setEditContent('');
      toast.success('Post updated successfully');
    },
    onError: () => {
      toast.error('Failed to update post');
    }
  });

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/profile/${user?.profile.username}`;
    if (navigator.share) {
      navigator.share({
        title: `${user?.profile.display_name || user?.profile.username}'s DQUOTE Profile`,
        url: profileUrl
      });
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard!');
    }
  };

  const startEditing = (post: any) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditContent('');
  };

  const saveEdit = () => {
    if (editingPost && editContent.trim()) {
      updatePostMutation.mutate({ postId: editingPost, content: editContent.trim() });
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">Profile</h1>
          <div className="flex items-center space-x-3">
            <button onClick={handleShare} className="p-2 hover:bg-gray-100 rounded-full">
              <Share className="h-5 w-5" />
            </button>
            <Link to="/settings" className="p-2 hover:bg-gray-100 rounded-full">
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white p-6 border-b">
        <div className="flex items-start space-x-4">
          <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
            {user.profile.avatar_url ? (
              <img 
                src={user.profile.avatar_url} 
                alt={user.profile.username} 
                className="w-20 h-20 rounded-full object-cover" 
              />
            ) : (
              <User className="h-10 w-10 text-gray-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-xl font-bold">{user.profile.display_name || user.profile.username}</h2>
              {user.profile.is_verified && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-2">@{user.profile.username}</p>
            {user.profile.bio && (
              <p className="text-gray-800 mb-3">{user.profile.bio}</p>
            )}
            
            {/* Social Links */}
            {user.profile.social_links && Object.keys(user.profile.social_links).length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(user.profile.social_links).map(([platform, url]) => (
                    <a 
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-sm hover:underline"
                    >
                      {platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex space-x-6 text-sm">
              <div className="text-center">
                <div className="font-bold">{stats?.followers || 0}</div>
                <div className="text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{stats?.following || 0}</div>
                <div className="text-gray-600">Following</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{stats?.totalPosts || 0}</div>
                <div className="text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-bold">{stats?.totalLikes || 0}</div>
                <div className="text-gray-600">Likes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Your Posts</h3>
        
        {postsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-lg border">
                {editingPost === post.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        disabled={updatePostMutation.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updatePostMutation.isPending ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <p className="text-gray-800 flex-1">{post.content}</p>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => startEditing(post)}
                          className="p-1 text-gray-400 hover:text-blue-600"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deletePostMutation.mutate(post.id)}
                          disabled={deletePostMutation.isPending}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {post.image_url && (
                      <img 
                        src={post.image_url} 
                        alt="Post" 
                        className="w-full rounded-lg mb-3 max-h-96 object-cover" 
                      />
                    )}

                    <div className="flex items-center justify-between text-gray-600 text-sm">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Heart className="h-4 w-4" />
                          <span>{post.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-600">Start sharing your thoughts with the world!</p>
            <Link 
              to="/create" 
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create your first post
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
