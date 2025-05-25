
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_private: boolean;
  is_verified: boolean;
  role: 'user' | 'admin';
  social_links: any;
  last_username_change: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  user: User;
  profile: Profile;
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    console.log('Getting current user...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return null;
    }
    
    if (!user) {
      console.log('No user found');
      return null;
    }
    
    console.log('User found, getting profile...');
    
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (profileError) {
      console.error('Error getting profile:', profileError);
      return null;
    }
    
    // If no profile exists, create one automatically
    if (!profile) {
      console.log('No profile found, creating one...');
      
      const username = user.user_metadata?.username || 
                      user.email?.split('@')[0] || 
                      `user_${user.id.slice(0, 8)}`;
      
      const displayName = user.user_metadata?.display_name || 
                         user.user_metadata?.full_name || 
                         'New User';
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username,
          display_name: displayName,
          role: 'user'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating profile:', createError);
        return null;
      }
      
      profile = newProfile;
      console.log('Profile created successfully');
    }
    
    console.log('User and profile loaded successfully');
    return { user, profile };
  } catch (error) {
    console.error('Unexpected error in getCurrentUser:', error);
    return null;
  }
};

export const signUp = async (email: string, password: string, username: string, displayName: string) => {
  console.log('Signing up user...');
  
  // Check if username is already taken
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle();
    
  if (existingUser) {
    throw new Error('Username is already taken');
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        display_name: displayName
      }
    }
  });
  
  if (error) throw error;
  console.log('User signed up successfully');
  return data;
};

export const signIn = async (email: string, password: string) => {
  console.log('Signing in user...');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    console.error('Sign in error:', error);
    throw error;
  }
  
  console.log('User signed in successfully');
  return data;
};

export const signOut = async () => {
  console.log('Signing out user...');
  
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Sign out error:', error);
    throw error;
  }
  
  console.log('User signed out successfully');
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};

export const updateProfile = async (updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', (await getCurrentUser())?.user.id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};
