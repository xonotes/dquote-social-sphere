
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const FollowersPage = () => {
  const { username } = useParams();

  const { data: profile } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!username
  });

  const { data: followers, isLoading } = useQuery({
    queryKey: ['followers', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey (
            id, username, display_name, avatar_url, is_verified, bio
          )
        `)
        .eq('following_id', profile.id);
      
      if (error) throw error;
      return data?.map(item => item.profiles).filter(Boolean) || [];
    },
    enabled: !!profile
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-white border-b p-4">
          <div className="flex items-center space-x-3">
            <Link to={`/profile/${username}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Followers</h1>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4">
        <div className="flex items-center space-x-3">
          <Link to={`/profile/${username}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Followers</h1>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {followers && followers.length > 0 ? (
          followers.map((follower: any) => (
            <Link 
              key={follower.id} 
              to={`/profile/${follower.username}`}
              className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                {follower.avatar_url ? (
                  <img src={follower.avatar_url} alt={follower.username} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold">{follower.display_name || follower.username}</span>
                  {follower.is_verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-sm">@{follower.username}</p>
                {follower.bio && <p className="text-gray-700 text-sm mt-1 line-clamp-1">{follower.bio}</p>}
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-12 text-gray-600">
            No followers yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowersPage;
