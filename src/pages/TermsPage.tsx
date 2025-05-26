
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b p-4">
        <div className="flex items-center space-x-3">
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
      </div>

      <div className="p-6 bg-white max-w-4xl mx-auto">
        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-bold mb-6">Terms of Service</h2>
          <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h3>
            <p className="text-gray-700 mb-4">
              By accessing and using DQUOTE, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">2. User Content</h3>
            <p className="text-gray-700 mb-4">
              Users are responsible for the content they post. Content must not be illegal, harmful, threatening, abusive, harassing, 
              defamatory, vulgar, obscene, libelous, invasive of another's privacy, hateful, or racially, ethnically or otherwise objectionable.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">3. Privacy</h3>
            <p className="text-gray-700 mb-4">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">4. Prohibited Uses</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Violating any applicable local, state, national or international law</li>
              <li>Transmitting any harassing, libelous, abusive or threatening material</li>
              <li>Attempting to interfere with service to any user, host or network</li>
              <li>Impersonating another person or entity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">5. Termination</h3>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, 
              under our sole discretion, for any reason whatsoever and without limitation.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">6. Changes to Terms</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any material changes.
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-4">7. Contact Information</h3>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us through our support channels.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
