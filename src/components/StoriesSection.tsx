
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';

interface Story {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

const StoriesSection = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!stories_user_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setStories(data);
      }
    };

    fetchStories();
  }, [user]);

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex space-x-4 overflow-x-auto">
        {/* Add Story Button */}
        <div className="flex flex-col items-center space-y-1 flex-shrink-0">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
            <Plus size={24} className="text-gray-500" />
          </div>
          <span className="text-xs text-gray-600">Your story</span>
        </div>

        {/* Stories */}
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center space-y-1 flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full p-0.5">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                {story.profiles.avatar_url ? (
                  <img 
                    src={story.profiles.avatar_url} 
                    alt={story.profiles.username}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 text-lg font-semibold">
                    {story.profiles.display_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-600 max-w-16 truncate">
              {story.profiles.display_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesSection;
