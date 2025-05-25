
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { User, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const RecommendedUsers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recommendedUsers } = useQuery({
    queryKey: ['recommended-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recommended_users')
        .select(`
          profiles!recommended_users_user_id_fkey (
            id, username, display_name, avatar_url, is_verified, bio
          )
        `)
        .limit(5);

      if (error) throw error;
      return data?.map(item => item.profiles).filter(Boolean) || [];
    },
    enabled: !!user
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user!.profile.id, following_id: userId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommended-users'] });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      toast({
        title: "Success",
        description: "User followed successfully!"
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

  if (!recommendedUsers || recommendedUsers.length === 0) return null;

  return (
    <div className="bg-white border-b p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Recommended for you</h3>
      <div className="flex space-x-4 overflow-x-auto">
        {recommendedUsers.map((profile: any) => (
          <div key={profile.id} className="flex-shrink-0 w-32 text-center">
            <div className="w-16 h-16 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <span className="text-sm font-medium text-gray-900 truncate">
                {profile.display_name || profile.username}
              </span>
              {profile.is_verified && (
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 mb-2">@{profile.username}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => followMutation.mutate(profile.id)}
              disabled={followMutation.isPending}
              className="w-full"
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Follow
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedUsers;
