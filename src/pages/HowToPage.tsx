
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, MessageSquare, Camera, Link2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const HowToPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 mr-4">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">How To Use DQUOTE</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Create Post */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>How to Create a Post</span>
            </CardTitle>
            <CardDescription>Learn how to share your thoughts with the community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="font-medium">1. Navigate to Create Page</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tap the "+" icon in the bottom navigation bar</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">2. Write Your Content</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Type your message in the text area. You can write up to 2000 characters.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">3. Add Image (Optional)</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paste a direct image URL to include a photo with your post</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">4. Share Your Post</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tap the "Share" button to publish your post</p>
            </div>
          </CardContent>
        </Card>

        {/* Create Story */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>How to Create a Story</span>
            </CardTitle>
            <CardDescription>Share temporary content that disappears after 24 hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="font-medium">1. Access Story Creation</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tap "Add story" in the stories section on your home page</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">2. Write Your Story</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add text content (up to 500 characters)</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">3. Add Image (Optional)</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Include an image URL to make your story more engaging</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">4. Share Your Story</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your story will be visible for 24 hours to your followers</p>
            </div>
          </CardContent>
        </Card>

        {/* Image Hosting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Image className="w-5 h-5" />
              <span>How to Add Images</span>
            </CardTitle>
            <CardDescription>Learn how to host and add images to your posts and stories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">Recommended Image Hosting Services:</p>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">ImgBB</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Free image hosting with direct links</p>
                    </div>
                    <a 
                      href="https://imgbb.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Imgur</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Popular image hosting platform</p>
                    </div>
                    <a 
                      href="https://imgur.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Steps to Add Images:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Upload your image to one of the hosting services above</li>
                <li>Copy the direct image URL (must end with .jpg, .png, .gif, etc.)</li>
                <li>Paste the URL in the image field when creating posts or stories</li>
                <li>The image will appear in your post/story automatically</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Profile Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link2 className="w-5 h-5" />
              <span>Profile & Social Links</span>
            </CardTitle>
            <CardDescription>Customize your profile and add social media links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="font-medium">Adding Social Links:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Go to Settings → Edit Profile</li>
                <li>Scroll to the Social Links section</li>
                <li>Add your social media URLs (Instagram, Twitter, YouTube, etc.)</li>
                <li>Save your profile</li>
                <li>Icons will appear on your profile below your bio</li>
              </ol>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Profile Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Use a clear profile picture</li>
                <li>Write an engaging bio</li>
                <li>Add your social links to gain more followers</li>
                <li>Apply for verification if you're a public figure</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HowToPage;
