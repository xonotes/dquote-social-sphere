
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image } from 'lucide-react';

const CreatePage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsLoading(true);

    try {
      // Check rate limit
      const { data: canPost } = await supabase
        .rpc('check_rate_limit', {
          p_user_id: user.profile.id,
          p_action: 'post',
          p_limit_seconds: 60
        });

      if (!canPost) {
        toast({
          title: "Rate limit exceeded",
          description: "You can only post once every 60 seconds",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.profile.id,
          content: content.trim(),
          image_url: imageUrl.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully"
      });

      setContent('');
      setImageUrl('');
      navigate('/home');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-semibold">Create Post</h1>
      </div>

      {/* Content */}
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Share your thoughts</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-32 resize-none border-none p-0 text-lg placeholder:text-gray-400 focus:ring-0"
                maxLength={500}
              />
              
              <div className="text-right text-sm text-gray-500">
                {content.length}/500
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Image size={16} />
                  <span className="text-sm">Add image (optional)</span>
                </div>
                <Input
                  type="url"
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              {imageUrl && (
                <div className="rounded-lg overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt="Preview"
                    className="w-full max-h-64 object-cover"
                    onError={() => {
                      toast({
                        title: "Invalid image URL",
                        description: "Please provide a valid image URL",
                        variant: "destructive"
                      });
                      setImageUrl('');
                    }}
                  />
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={!content.trim() || isLoading}
              >
                {isLoading ? 'Posting...' : 'Share Post'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePage;
