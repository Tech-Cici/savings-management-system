'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { apiService, Customer, Transaction } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, User, LogOut, Mail, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailsPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadCustomerData();
  }, [loading, user, router, customerId]);

  const loadCustomerData = async () => {
    try {
      const [customerData, allTransactions] = await Promise.all([
        apiService.getCustomer(customerId),
        apiService.getTransactions()
      ]);
      
      setCustomer(customerData);
      // Filter transactions for this customer
      setTransactions(allTransactions.filter(t => t.userId === customerId));
    } catch (error) {
      console.error('Failed to load customer data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleVerifyCustomer = async () => {
    if (!customer) return;
    try {
      await apiService.verifyCustomer(customer.id);
      setCustomer({ ...customer, isVerified: true });
    } catch (error) {
      console.error('Failed to verify customer:', error);
    }
  };

  const handleRejectCustomer = async () => {
    if (!customer) return;
    setRejectLoading(true);
    try {
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + `/api/admin/customers/${customer.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : {}),
          ...(localStorage.getItem('sessionId') ? { 'X-Session-ID': localStorage.getItem('sessionId') as string } : {}),
        },
        body: JSON.stringify({ reason: rejectReason })
      });
      setRejectOpen(false);
      setRejectReason('');
      setCustomer({ ...customer, isVerified: false });
    } catch (e) {
      console.error('Failed to reject customer:', e);
    } finally {
      setRejectLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Customer not found</p>
            <Button onClick={() => router.push('/admin/dashboard')} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg border-r">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-6 w-6 text-accent" />
            <h2 className="text-lg font-semibold">Admin Portal</h2>
          </div>
          <div className="text-sm text-gray-500">{user?.name}</div>
        </div>
        
        <nav className="p-4 space-y-2">
          <Link href="/admin/dashboard">
            <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </Link>
          <div className="pt-4 border-t mt-4">
            <Link href="/admin/profile">
              <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left hover:bg-gray-100">
                <User className="h-5 w-5" />
                <span>Profile</span>
              </button>
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left hover:bg-gray-100 text-red-600 mt-2"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="bg-white shadow-sm border-b p-6">
          <h1 className="text-2xl font-bold">Customer Details</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Name</div>
                  <div className="text-lg font-medium">{customer.name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Email</div>
                  <div className="text-lg font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {customer.email}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Device ID</div>
                  <div className="text-lg font-mono text-sm">{customer.deviceId || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Balance</div>
                  <div className={`text-2xl font-bold ${(customer.balance || 0) < 100 ? 'text-red-600' : 'text-green-600'}`}>
                    <DollarSign className="h-5 w-5 inline mr-1" />
                    {customer.balance.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <Badge variant={customer.isVerified ? "default" : "secondary"}>
                    {customer.isVerified ? "Verified" : "Pending Verification"}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Account Created</div>
                  <div className="text-lg">{new Date(customer.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                {!customer.isVerified && (
                  <Button onClick={handleVerifyCustomer}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Customer
                  </Button>
                )}
                <Button variant="destructive" onClick={() => setRejectOpen(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                All transactions for this customer ({transactions.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge variant={transaction.type === 'deposit' ? "default" : "secondary"}>
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ${transaction.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {transaction.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500 mr-1" />}
                            {transaction.status === 'failed' && <XCircle className="h-4 w-4 text-red-500 mr-1" />}
                            <Badge 
                              variant={
                                transaction.status === 'completed' ? 'default' : 
                                transaction.status === 'failed' ? 'destructive' : 'secondary'
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.description || '-'}</TableCell>
                        <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Customer</DialogTitle>
          <DialogDescription>
            Provide an optional reason. The customer will be notified by email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason</Label>
          <Textarea id="reason" placeholder="Optional reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleRejectCustomer} disabled={rejectLoading}>
            {rejectLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Reject
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

