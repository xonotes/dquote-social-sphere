
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
  profiles: {
    username: string;
    display_name: string;
    avatar_url?: string;
    is_verified: boolean;
  };
}

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFullContent, setShowFullContent] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      if (post.user_has_liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.profile.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: user.profile.id });
        
        if (error) throw error;

        // Create notification if liking someone else's post
        if (post.user_id !== user.profile.id) {
          await supabase.rpc('create_notification', {
            p_user_id: post.user_id,
            p_actor_id: user.profile.id,
            p_type: 'like',
            p_post_id: post.id
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const shouldTruncate = post.content.length > 300;
  const displayContent = shouldTruncate && !showFullContent 
    ? post.content.slice(0, 300) + '...'
    : post.content;

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    toast({
      title: "Link copied!",
      description: "Post link has been copied to clipboard"
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${post.profiles.username}`}>
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              {post.profiles.avatar_url ? (
                <img
                  src={post.profiles.avatar_url}
                  alt={post.profiles.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-semibold">
                  {post.profiles.display_name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
          </Link>
          <div>
            <div className="flex items-center space-x-1">
              <Link to={`/profile/${post.profiles.username}`}>
                <span className="font-semibold hover:underline">
                  {post.profiles.display_name}
                </span>
              </Link>
              {post.profiles.is_verified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <Link to={`/profile/${post.profiles.username}`}>
              <span className="text-gray-600 text-sm hover:underline">
                @{post.profiles.username}
              </span>
            </Link>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-gray-900 whitespace-pre-wrap">{displayContent}</p>
        {shouldTruncate && (
          <button
            onClick={() => setShowFullContent(!showFullContent)}
            className="text-blue-600 text-sm mt-1 hover:underline"
          >
            {showFullContent ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="mb-3">
          <img
            src={post.image_url}
            alt="Post content"
            className="w-full rounded-lg max-h-96 object-cover"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className={`flex items-center space-x-2 ${
              post.user_has_liked ? 'text-red-500' : 'text-gray-500'
            } hover:text-red-500 transition-colors`}
          >
            <Heart
              size={20}
              className={post.user_has_liked ? 'fill-current' : ''}
            />
            <span className="text-sm">{post.likes_count}</span>
          </button>
          
          <Link to={`/post/${post.id}/comments`}>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
              <MessageCircle size={20} />
              <span className="text-sm">{post.comments_count}</span>
            </button>
          </Link>
          
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors"
          >
            <Share size={20} />
          </button>
        </div>
        
        <span className="text-gray-500 text-sm">
          {new Date(post.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

export default PostCard;
