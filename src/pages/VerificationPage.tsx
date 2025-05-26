
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VerificationPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    website: '',
    twitter: '',
    instagram: '',
    linkedin: ''
  });

  const submitVerification = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          user_id: user.profile.id,
          bio,
          social_links: socialLinks
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your verification request has been submitted. We'll review it within 3-5 business days."
      });
      setBio('');
      setSocialLinks({ website: '', twitter: '', instagram: '', linkedin: '' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bio.trim()) {
      toast({
        title: "Error",
        description: "Bio is required for verification",
        variant: "destructive"
      });
      return;
    }
    submitVerification.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4">
        <div className="flex items-center space-x-3">
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Verification Request</h1>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-8 w-8 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold">Get Verified</h2>
              <p className="text-gray-600">Apply for a verified badge on your profile</p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Verification Criteria</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Account must be authentic and represent a real person or entity</li>
              <li>• Account must be complete with a bio and profile photo</li>
              <li>• Account must be notable and of public interest</li>
              <li>• Must provide valid social media links</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself or your organization..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={socialLinks.website}
                  onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="twitter">Twitter/X</Label>
                <Input
                  id="twitter"
                  placeholder="@yourusername"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  placeholder="@yourusername"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  placeholder="linkedin.com/in/yourprofile"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                  className="mt-1"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitVerification.isPending || !bio.trim()}
            >
              {submitVerification.isPending ? 'Submitting...' : 'Submit Verification Request'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
