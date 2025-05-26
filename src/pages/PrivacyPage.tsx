
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4">
        <div className="flex items-center space-x-3">
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      <div className="p-6 bg-white max-w-4xl mx-auto">
        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-bold mb-6">Privacy Policy</h2>
          <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">1. Information We Collect</h3>
            <p className="text-gray-700 mb-4">
              We collect information you provide directly to us, such as when you create an account, update your profile, 
              post content, or contact us for support.
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Account information (username, email, display name)</li>
              <li>Profile information (bio, avatar, social links)</li>
              <li>Content you post (posts, comments, likes)</li>
              <li>Usage information (how you interact with our service)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">2. How We Use Your Information</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>To provide, maintain, and improve our services</li>
              <li>To process transactions and send related information</li>
              <li>To send technical notices and support messages</li>
              <li>To communicate with you about products, services, and events</li>
              <li>To monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">3. Information Sharing</h3>
            <p className="text-gray-700 mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in the following situations:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>In connection with a business transfer</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">4. Data Security</h3>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">5. Your Rights</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of certain communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">6. Changes to Privacy Policy</h3>
            <p className="text-gray-700 mb-4">
              We may update this privacy policy from time to time. We will notify you of any material changes by posting 
              the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">7. Contact Us</h3>
            <p className="text-gray-700 mb-4">
              If you have any questions about this Privacy Policy, please contact us through our support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
