
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PostDetailPage = () => {
  const { postId } = useParams();
  const { user } = useAuth();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      if (!postId) throw new Error('Post ID is required');

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (username, display_name, avatar_url, is_verified)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Get likes and comments count
      const [likesRes, commentsRes, userLikeRes] = await Promise.all([
        supabase.from('likes').select('id', { count: 'exact' }).eq('post_id', postId),
        supabase.from('comments').select('id', { count: 'exact' }).eq('post_id', postId),
        user ? supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.profile.id).maybeSingle() : Promise.resolve({ data: null })
      ]);

      return {
        ...data,
        likes_count: likesRes.count || 0,
        comments_count: commentsRes.count || 0,
        user_has_liked: !!userLikeRes.data
      };
    },
    enabled: !!postId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-3">
            <Link to="/home">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-white rounded-lg border animate-pulse">
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/3 mb-1"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-3">
            <Link to="/home">
              <Button variant="ghost" size="sm">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Post</h1>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Post not found</h2>
            <p className="text-gray-600 mb-4">The post you're looking for doesn't exist or has been deleted.</p>
            <Link to="/home">
              <Button>Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center space-x-3 p-4">
          <Link to="/home">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </div>
      
      <PostCard post={post} />
      
      <div className="mt-4 bg-white border-t">
        <Link 
          to={`/post/${postId}/comments`}
          className="block p-4 text-center text-blue-600 hover:bg-gray-50 transition-colors"
        >
          View Comments ({post.comments_count})
        </Link>
      </div>
    </div>
  );
};

export default PostDetailPage;
