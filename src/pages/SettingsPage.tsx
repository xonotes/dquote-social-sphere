
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Lock, Shield, Moon, Sun, FileText, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

const SettingsPage = () => {
  const { user, refetchUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPrivate, setIsPrivate] = useState(user?.profile.is_private || false);
  const [loading, setLoading] = useState(false);

  const handlePrivacyToggle = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_private: !isPrivate })
        .eq('id', user.user.id);

      if (error) throw error;

      setIsPrivate(!isPrivate);
      await refetchUser();
      toast.success(`Profile is now ${!isPrivate ? 'private' : 'public'}`);
    } catch (error: any) {
      toast.error('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error('Failed to log out');
    }
  };

  const handleResetPassword = async () => {
    if (!user?.user.email) return;
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.user.email);
      if (error) throw error;
      toast.success('Password reset email sent!');
    } catch (error: any) {
      toast.error('Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Account Section */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Account</h2>
          </div>
          <div className="divide-y">
            <Link 
              to="/profile" 
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-600" />
                <span>Edit Profile</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            
            <button 
              onClick={handleResetPassword}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
            >
              <div className="flex items-center space-x-3">
                <Lock className="h-5 w-5 text-gray-600" />
                <span>Reset Password</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Privacy</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Private Account</p>
                  <p className="text-sm text-gray-600">Only followers can see your posts</p>
                </div>
              </div>
              <button
                onClick={handlePrivacyToggle}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isPrivate ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isPrivate ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {isDarkMode ? (
                  <Moon className="h-5 w-5 text-gray-600" />
                ) : (
                  <Sun className="h-5 w-5 text-gray-600" />
                )}
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-gray-600">Switch to dark theme</p>
                </div>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Verification</h2>
          </div>
          <div className="divide-y">
            <Link 
              to="/verification" 
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span>Request Verification</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Legal Section */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Legal</h2>
          </div>
          <div className="divide-y">
            <Link 
              to="/terms" 
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <span>Terms of Service</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            
            <Link 
              to="/privacy" 
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="h-5 w-5 text-gray-600" />
                <span>Privacy Policy</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Admin Section (only for admins) */}
        {user?.profile.role === 'admin' && (
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Admin</h2>
            </div>
            <div className="divide-y">
              <Link 
                to="/admin" 
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span>Admin Dashboard</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </div>
        )}

        {/* Logout Section */}
        <div className="bg-white rounded-lg border">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 text-red-600"
          >
            <div className="flex items-center space-x-3">
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
