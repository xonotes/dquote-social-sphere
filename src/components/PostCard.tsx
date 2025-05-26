
import React, { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PostCardProps {
  post: {
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
    user_id?: string;
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  const shouldTruncate = post.content.length > 300;
  const displayContent = shouldTruncate && !showFullContent 
    ? post.content.slice(0, 300) + '...' 
    : post.content;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      setIsLiking(true);

      if (isLiked) {
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

        // Create notification for post owner
        if (post.user_id && post.user_id !== user.profile.id) {
          await supabase.rpc('create_notification', {
            p_user_id: post.user_id,
            p_actor_id: user.profile.id,
            p_type: 'like',
            p_post_id: post.id
          });
        }
      }
    },
    onMutate: () => {
      const previousLiked = isLiked;
      const previousCount = likesCount;
      
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      
      return { previousLiked, previousCount };
    },
    onError: (error: any, variables, context) => {
      setIsLiked(context?.previousLiked || false);
      setLikesCount(context?.previousCount || 0);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsLiking(false);
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast({
        title: "Success",
        description: "Post deleted successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Post link has been copied to clipboard"
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const isOwnPost = post.user_id === user?.profile.id;

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.profiles.username}`} className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            {post.profiles.avatar_url ? (
              <img 
                src={post.profiles.avatar_url} 
                alt={post.profiles.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 text-sm font-semibold">
                {post.profiles.display_name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-sm">{post.profiles.display_name}</span>
              {post.profiles.is_verified && (
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className="text-gray-500 text-xs">@{post.profiles.username}</span>
          </div>
        </Link>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-xs">{formatTimeAgo(post.created_at)}</span>
          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => deleteMutation.mutate()}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <Link to={`/post/${post.id}`} className="block">
        <div className="px-4 pb-3">
          <p className="text-gray-900 whitespace-pre-wrap">{displayContent}</p>
          {shouldTruncate && !showFullContent && (
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowFullContent(true);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm mt-1"
            >
              Read more
            </button>
          )}
          {post.image_url && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img 
                src={post.image_url} 
                alt="Post content"
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => likeMutation.mutate()}
            className={`flex items-center space-x-2 transition-all duration-200 ${
              isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
            }`}
            disabled={isLiking || !user}
          >
            <Heart 
              size={20} 
              fill={isLiked ? 'currentColor' : 'none'}
              className={`transition-transform duration-200 ${isLiking ? 'scale-110' : 'scale-100'}`}
            />
            <span className="text-sm font-medium">{likesCount}</span>
          </button>
          <Link 
            to={`/post/${post.id}/comments`} 
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <MessageCircle size={20} />
            <span className="text-sm font-medium">{post.comments_count || 0}</span>
          </Link>
        </div>
        <button 
          onClick={handleShare} 
          className="text-gray-600 hover:text-green-600 transition-colors"
        >
          <Share size={20} />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
