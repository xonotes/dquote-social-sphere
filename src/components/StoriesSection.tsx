
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Story {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

const StoriesSection = () => {
  const { user } = useAuth();

  const { data: stories } = useQuery({
    queryKey: ['stories', user?.profile.id],
    queryFn: async () => {
      if (!user) return [];

      // Get users that the current user follows
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.profile.id);

      const followingIds = followingData?.map(f => f.following_id) || [];
      
      // Include current user + following users
      const userIds = [user.profile.id, ...followingIds];

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!stories_user_id_fkey (username, display_name, avatar_url)
        `)
        .in('user_id', userIds)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Story[];
    },
    enabled: !!user
  });

  const { data: userHasStory } = useQuery({
    queryKey: ['user-story', user?.profile.id],
    queryFn: async () => {
      if (!user) return false;

      const { data } = await supabase
        .from('stories')
        .select('id')
        .eq('user_id', user.profile.id)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      return !!data;
    },
    enabled: !!user
  });

  // Group stories by user, showing only the most recent one per user
  const uniqueStories = stories?.reduce((acc: Story[], story) => {
    const existingStory = acc.find(s => s.user_id === story.user_id);
    if (!existingStory) {
      acc.push(story);
    }
    return acc;
  }, []) || [];

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex space-x-4 overflow-x-auto">
        {/* Add Story Button */}
        <div className="flex flex-col items-center space-y-1 flex-shrink-0">
          <Link to="/story/create">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
              userHasStory 
                ? 'bg-gradient-to-r from-purple-400 to-pink-400 border-transparent p-0.5'
                : 'bg-gray-200 dark:bg-gray-700 border-dashed border-gray-300 dark:border-gray-600'
            }`}>
              {userHasStory ? (
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                  {user?.profile.avatar_url ? (
                    <img 
                      src={user.profile.avatar_url} 
                      alt={user.profile.username}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300 text-lg font-semibold">
                      {user?.profile.display_name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
              ) : (
                <Plus size={24} className="text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </Link>
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {userHasStory ? 'Your story' : 'Add story'}
          </span>
        </div>

        {/* Stories */}
        {uniqueStories.map((story) => (
          <div key={story.id} className="flex flex-col items-center space-y-1 flex-shrink-0">
            <Link to={`/story/${story.user_id}`}>
              <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full p-0.5">
                <div className="w-full h-full bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
                  {story.profiles.avatar_url ? (
                    <img 
                      src={story.profiles.avatar_url} 
                      alt={story.profiles.username}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300 text-lg font-semibold">
                      {story.profiles.display_name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
            <span className="text-xs text-gray-600 dark:text-gray-300 max-w-16 truncate">
              {story.profiles.display_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesSection;
