
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Image, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreatePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Check rate limit
      const { data: canPost } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.profile.id,
        p_action: 'post',
        p_limit_seconds: 60
      });

      if (!canPost) {
        throw new Error('You can only post once per minute. Please wait.');
      }

      if (!content.trim()) {
        throw new Error('Post content cannot be empty');
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.profile.id,
          content: content.trim(),
          image_url: imageUrl.trim() || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      
      toast({
        title: "Success!",
        description: "Your post has been created successfully."
      });
      
      setContent('');
      setImageUrl('');
      navigate('/home');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPostMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="text-gray-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold">Create Post</h1>
          <div className="w-6"></div>
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 space-y-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              {user?.profile.avatar_url ? (
                <img
                  src={user.profile.avatar_url}
                  alt={user.profile.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-blue-600 text-sm font-semibold">
                  {user?.profile.display_name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-semibold">{user?.profile.display_name}</span>
                {user?.profile.is_verified && (
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
              <span className="text-gray-500 text-sm">@{user?.profile.username}</span>
            </div>
          </div>

          <div>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] border-none resize-none text-lg placeholder:text-gray-400 focus:ring-0"
              maxLength={2000}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {content.length}/2000
            </div>
          </div>

          <div>
            <Label htmlFor="image-url" className="flex items-center space-x-2 text-gray-600">
              <Image size={16} />
              <span>Image URL (optional)</span>
            </Label>
            <Input
              id="image-url"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1"
            />
          </div>

          {imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="w-full max-h-64 object-cover"
                onError={() => setImageUrl('')}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!content.trim() || createPostMutation.isPending}
          >
            {createPostMutation.isPending ? (
              <>Creating...</>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Create Post
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreatePage;
