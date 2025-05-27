
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthGate from "@/components/AuthGate";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import ExplorePage from "@/pages/ExplorePage";
import CreatePage from "@/pages/CreatePage";
import NotificationsPage from "@/pages/NotificationsPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import PostDetailPage from "@/pages/PostDetailPage";
import CommentsPage from "@/pages/CommentsPage";
import VerificationPage from "@/pages/VerificationPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import FollowersPage from "@/pages/FollowersPage";
import FollowingPage from "@/pages/FollowingPage";
import StoryCreatePage from "@/pages/StoryCreatePage";
import StoryViewPage from "@/pages/StoryViewPage";
import AdminPage from "@/pages/AdminPage";
import OTPVerificationPage from "@/pages/OTPVerificationPage";
import NotFound from "@/pages/NotFound";
import HowToPage from "@/pages/HowToPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000,
      gcTime: 300000,
      refetchInterval: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      networkMode: 'online'
    },
    mutations: {
      retry: 1,
      networkMode: 'online'
    }
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/verify-otp" element={<OTPVerificationPage />} />
                
                {/* Protected routes */}
                <Route path="/" element={<AuthGate><Navigate to="/home" replace /></AuthGate>} />
                <Route path="/" element={<AuthGate><Layout /></AuthGate>}>
                  <Route path="home" element={<HomePage />} />
                  <Route path="explore" element={<ExplorePage />} />
                  <Route path="create" element={<CreatePage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="profile/:username?" element={<ProfilePage />} />
                  <Route path="profile/:username/followers" element={<FollowersPage />} />
                  <Route path="profile/:username/following" element={<FollowingPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="how-to" element={<HowToPage />} />
                  <Route path="verification" element={<VerificationPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />
                  <Route path="admin" element={<AdminPage />} />
                  <Route path="story/create" element={<StoryCreatePage />} />
                  <Route path="story/:userId" element={<StoryViewPage />} />
                </Route>
                <Route path="/post/:postId" element={<AuthGate><PostDetailPage /></AuthGate>} />
                <Route path="/post/:postId/comments" element={<AuthGate><CommentsPage /></AuthGate>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
