'use client';

import { useEffect } from 'react';
import { useAuth } from '@/store/auth-context';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';

export default function ClientProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user || user.role !== 'client') {
      router.push('/client/login');
    }
  }, [loading, isAuthenticated, user, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Name</div>
              <div className="text-lg font-medium">{user.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="text-lg font-medium">{user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-500">Status</div>
              <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                {user.isVerified ? 'Verified' : 'Pending Verification'}
              </Badge>
            </div>
            <div className="pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete your account and all transactions. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + '/api/client/account', {
                            method: 'DELETE',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
                              ...(localStorage.getItem('sessionId') ? { 'X-Session-ID': localStorage.getItem('sessionId') as string } : {}),
                            },
                          });
                        } finally {
                          // Force logout locally regardless of API response
                          localStorage.removeItem('token');
                          localStorage.removeItem('user');
                          localStorage.removeItem('sessionId');
                          window.location.href = '/';
                        }
                      }}
                    >
                      Yes, delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


