
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const CommentsPage = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: post } = useQuery({
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
      return data;
    },
    enabled: !!postId
  });

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      if (!postId) return [];

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (username, display_name, avatar_url, is_verified)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!postId
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      if (!user || !postId || !comment.trim()) {
        throw new Error('Missing required data');
      }

      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.profile.id,
          content: comment.trim()
        });

      if (error) throw error;

      // Create notification for post owner
      if (post && post.user_id !== user.profile.id) {
        await supabase.rpc('create_notification', {
          p_user_id: post.user_id,
          p_actor_id: user.profile.id,
          p_type: 'comment',
          p_post_id: postId
        });
      }
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      toast({
        title: "Success",
        description: "Comment added successfully"
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center space-x-3 p-4">
          <Link to={`/post/${postId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Comments</h1>
        </div>
      </div>

      {/* Post Preview */}
      {post && (
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {post.profiles?.avatar_url ? (
                <img 
                  src={post.profiles.avatar_url} 
                  alt={post.profiles.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 text-sm font-semibold">
                  {post.profiles?.display_name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-sm">{post.profiles?.display_name}</span>
                {post.profiles?.is_verified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <span className="text-gray-500 text-xs">@{post.profiles?.username}</span>
            </div>
          </div>
          <p className="text-gray-900 text-sm">{post.content}</p>
        </div>
      )}

      {/* Comments */}
      <div className="bg-white">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-1"></div>
                    <div className="h-4 bg-gray-300 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="divide-y">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex space-x-3">
                  <Link to={`/profile/${comment.profiles?.username}`}>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {comment.profiles?.avatar_url ? (
                        <img 
                          src={comment.profiles.avatar_url} 
                          alt={comment.profiles.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 text-sm font-semibold">
                          {comment.profiles?.display_name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Link to={`/profile/${comment.profiles?.username}`}>
                        <span className="font-semibold text-sm hover:underline">
                          {comment.profiles?.display_name}
                        </span>
                      </Link>
                      {comment.profiles?.is_verified && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                      <span className="text-gray-500 text-xs">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-900 text-sm">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-600">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>

      {/* Comment Input */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {user.profile.avatar_url ? (
                <img 
                  src={user.profile.avatar_url} 
                  alt={user.profile.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 text-sm font-semibold">
                  {user.profile.display_name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 flex space-x-2">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 min-h-[40px] max-h-[120px] resize-none"
                rows={1}
              />
              <Button
                onClick={() => commentMutation.mutate()}
                disabled={!comment.trim() || commentMutation.isPending}
                size="sm"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsPage;
