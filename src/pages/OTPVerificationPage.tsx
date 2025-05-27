
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Mail } from 'lucide-react';

const OTPVerificationPage = () => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;
  const password = location.state?.password;
  const username = location.state?.username;
  const displayName = location.state?.displayName;

  useEffect(() => {
    if (!email) {
      navigate('/');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // OTP verified, now sign in the user
      await signIn(email, password);
      
      toast({
        title: "Success!",
        description: "Email verified successfully. Welcome to DQUOTE!"
      });

      navigate('/home');
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendOTP = async () => {
    setIsResending(true);

    try {
      const response = await fetch('/api/v1/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend OTP');
      }

      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email"
      });

      setCountdown(60);
      setOtp('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/lovable-uploads/8e60a9a6-f9b0-4722-81cb-c59464a14723.png" alt="DQUOTE" className="h-16" />
          </div>
          <h1 className="text-4xl font-bold text-blue-600 mb-2">DQUOTE</h1>
          <p className="text-gray-600 dark:text-gray-300">Verify Your Email</p>
        </div>

        <Card className="dark:bg-gray-900 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <CardTitle className="dark:text-white">Email Verification</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Enter the 6-digit code sent to {email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-center space-x-2 text-blue-600">
                <Mail size={24} />
                <span className="text-sm">Check your email for the verification code</span>
              </div>

              <div className="flex justify-center">
                <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button 
                onClick={verifyOTP}
                className="w-full" 
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  Didn't receive the code?
                </p>
                <Button
                  variant="outline"
                  onClick={resendOTP}
                  disabled={isResending || countdown > 0}
                  className="w-full"
                >
                  {isResending 
                    ? "Resending..." 
                    : countdown > 0 
                    ? `Resend in ${countdown}s` 
                    : "Resend Code"
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
