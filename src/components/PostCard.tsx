
import React, { useState } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

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
    likes: { count: number }[];
    comments: { count: number }[];
    user_has_liked: boolean;
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(post.user_has_liked);
  const [likesCount, setLikesCount] = useState(post.likes[0]?.count || 0);

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.profile.id);
        
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
      } else {
        await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: user.profile.id });
        
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive"
      });
    }
  };

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

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
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
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <span className="text-gray-500 text-xs">@{post.profiles.username}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 text-xs">{formatTimeAgo(post.created_at)}</span>
          <Button variant="ghost" size="sm">
            <MoreHorizontal size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
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

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-2 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
          >
            <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
            <span className="text-sm">{likesCount}</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600">
            <MessageCircle size={20} />
            <span className="text-sm">{post.comments[0]?.count || 0}</span>
          </button>
        </div>
        <button onClick={handleShare} className="text-gray-600">
          <Share size={20} />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
