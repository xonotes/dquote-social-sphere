
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, Image } from 'lucide-react';

const StoryCreatePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const createStoryMutation = useMutation({
    mutationFn: async () => {
      if (!user || !content.trim()) throw new Error('Content is required');

      const { error } = await supabase
        .from('stories')
        .insert({
          user_id: user.profile.id,
          content: content.trim(),
          image_url: imageUrl.trim() || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Story created!",
        description: "Your story has been shared successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['stories'] });
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

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to your story",
        variant: "destructive"
      });
      return;
    }
    createStoryMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create Story</h1>
          <Button 
            onClick={handleSubmit}
            disabled={createStoryMutation.isPending || !content.trim()}
            size="sm"
          >
            Share
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {user?.profile.avatar_url ? (
                <img
                  src={user.profile.avatar_url}
                  alt={user.profile.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300 font-semibold">
                  {user?.profile.display_name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.profile.display_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your story • 24h</p>
            </div>
          </div>

          <Textarea
            placeholder="Share what's on your mind..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-32 border-0 p-0 resize-none text-lg placeholder:text-gray-400 focus-visible:ring-0 bg-transparent text-gray-900 dark:text-white"
            maxLength={500}
          />

          <div className="mt-4">
            <Input
              placeholder="Add image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mb-3"
            />
            
            {imageUrl && (
              <div className="mb-3">
                <img
                  src={imageUrl}
                  alt="Story preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                  onError={() => {
                    toast({
                      title: "Invalid image URL",
                      description: "Please check your image URL",
                      variant: "destructive"
                    });
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{content.length}/500</span>
            <div className="flex items-center space-x-2">
              <Image size={16} />
              <span>Add image URL above</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Your story will be visible for 24 hours
        </div>
      </div>
    </div>
  );
};

export default StoryCreatePage;
