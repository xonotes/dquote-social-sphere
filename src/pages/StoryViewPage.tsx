
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react';

interface Story {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

const StoryViewPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const { data: stories } = useQuery({
    queryKey: ['user-stories', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles!stories_user_id_fkey (username, display_name, avatar_url)
        `)
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Story[];
    },
    enabled: !!userId
  });

  useEffect(() => {
    if (!stories || stories.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            navigate('/home');
            return 100;
          }
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [currentIndex, stories, navigate, isPaused]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (stories && currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      navigate('/home');
    }
  };

  const handleClose = () => {
    navigate('/home');
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  if (!stories || stories.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <p>No stories found</p>
          <button onClick={handleClose} className="mt-4 text-blue-400">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <div className="min-h-screen bg-black relative">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 z-10 flex space-x-1">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-gray-600 rounded">
            <div
              className="h-full bg-white rounded transition-all duration-100"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {currentStory.profiles.avatar_url ? (
              <img
                src={currentStory.profiles.avatar_url}
                alt={currentStory.profiles.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-gray-600 text-sm font-semibold">
                {currentStory.profiles.display_name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div>
            <p className="text-white font-semibold">{currentStory.profiles.display_name}</p>
            <p className="text-gray-300 text-sm">
              {new Date(currentStory.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={togglePause} className="text-white">
            {isPaused ? '▶️' : '⏸️'}
          </button>
          <button onClick={handleClose} className="text-white">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Navigation areas */}
      <div className="absolute inset-0 flex z-5">
        <div className="flex-1 flex items-center justify-start pl-4" onClick={handlePrevious}>
          {currentIndex > 0 && (
            <ChevronLeft size={32} className="text-white opacity-50" />
          )}
        </div>
        <div className="flex-1" onClick={togglePause}></div>
        <div className="flex-1 flex items-center justify-end pr-4" onClick={handleNext}>
          <ChevronRight size={32} className="text-white opacity-50" />
        </div>
      </div>

      {/* Story content */}
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-white text-center max-w-md w-full">
          {currentStory.image_url && (
            <div className="mb-6">
              <img
                src={currentStory.image_url}
                alt="Story content"
                className="w-full max-h-96 object-cover rounded-lg"
              />
            </div>
          )}
          <p className="text-lg leading-relaxed">{currentStory.content}</p>
        </div>
      </div>

      {/* Story indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
        <div className="text-white text-center">
          <span className="text-sm">{currentIndex + 1} / {stories.length}</span>
        </div>
      </div>
    </div>
  );
};

export default StoryViewPage;
