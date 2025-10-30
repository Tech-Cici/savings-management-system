'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth-context';
import { useRouter } from 'next/navigation';
import { apiService, DashboardStats, Customer, Transaction } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, XCircle, User, LogOut, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customers');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    loadDashboardData();
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [loading, user, router]);

  const loadDashboardData = async () => {
    try {
      const [statsData, customersData, transactionsData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getCustomers(),
        apiService.getTransactions()
      ]);
      
      setStats(statsData);
      setCustomers(customersData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleVerifyCustomer = async (customerId: string) => {
    try {
      await apiService.verifyCustomer(customerId);
      setCustomers(prev => 
        prev.map(customer => 
          customer.id === customerId 
            ? { ...customer, isVerified: true }
            : customer
        )
      );
      loadDashboardData(); // Refresh stats
    } catch (error) {
      console.error('Failed to verify customer:', error);
    }
  };

  const handleRejectCustomer = async () => {
    if (!rejectId) return;
    setRejectLoading(true);
    try {
      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001') + `/api/admin/customers/${rejectId}/reject`, {
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
      setRejectId(null);
      loadDashboardData();
    } catch (e) {
      console.error('Failed to reject customer:', e);
    } finally {
      setRejectLoading(false);
    }
  };

  const pendingCustomers = customers.filter(c => !c.isVerified);
  const lowBalanceCustomers = customers.filter(c => (c.balance || 0) < 100);

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
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
          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'customers' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-gray-100'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Customers</span>
            <Badge className="ml-auto">{stats?.totalCustomers || 0}</Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'transactions' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Transactions</span>
            <Badge className="ml-auto">{stats?.totalTransactions || 0}</Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('pending')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'pending' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
            <span>Pending Verifications</span>
            <Badge variant="secondary" className="ml-auto">{stats?.pendingVerifications || 0}</Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('low-balance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'low-balance' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-gray-100'
            }`}
          >
            <DollarSign className="h-5 w-5" />
            <span>Low Balance</span>
            <Badge variant="destructive" className="ml-auto">{stats?.lowBalanceCustomers || 0}</Badge>
          </button>

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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>

        <div className="p-6">
          {/* Stats Cards - Clickable */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab('customers')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab('transactions')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab('pending')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats?.pendingVerifications || 0}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setActiveTab('low-balance')}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Balance Customers</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats?.lowBalanceCustomers || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Content */}
          <Card>
            <CardContent className="p-6">
              {activeTab === 'customers' && (
                <div>
                  <CardHeader>
                    <CardTitle>All Customers</CardTitle>
                    <CardDescription>Manage and verify customer accounts</CardDescription>
                  </CardHeader>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Device ID</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => {
                        const isLowBalance = (customer.balance || 0) < 100;
                        return (
                          <TableRow 
                            key={customer.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => router.push(`/admin/customers/${customer.id}`)}
                          >
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell className="font-mono text-sm">{customer.deviceId || 'N/A'}</TableCell>
                            <TableCell className={isLowBalance ? 'text-red-600 font-bold' : ''}>
                              ${customer.balance.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={customer.isVerified ? "default" : "secondary"}>
                                {customer.isVerified ? "Verified" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()} className="space-x-2">
                              {!customer.isVerified && (
                                <>
                                  <Button size="sm" onClick={() => handleVerifyCustomer(customer.id)}>
                                    Verify
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => { setRejectId(customer.id); setRejectOpen(true); }}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div>
                  <CardHeader>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>View all customer transactions</CardDescription>
                  </CardHeader>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 50).map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Badge variant={transaction.type === 'deposit' ? "default" : "secondary"}>
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {transaction.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500 mr-1" />}
                              {transaction.status === 'failed' && <XCircle className="h-4 w-4 text-red-500 mr-1" />}
                              {transaction.status === 'pending' && <Loader2 className="h-4 w-4 text-yellow-500 mr-1 animate-spin" />}
                              {transaction.status}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'pending' && (
                <div>
                  <CardHeader>
                    <CardTitle>Pending Verifications</CardTitle>
                    <CardDescription>Customers awaiting admin verification</CardDescription>
                  </CardHeader>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Device ID</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500">
                            No pending verifications
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingCustomers.map((customer) => (
                          <TableRow 
                            key={customer.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => router.push(`/admin/customers/${customer.id}`)}
                          >
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell className="font-mono text-sm">{customer.deviceId || 'N/A'}</TableCell>
                            <TableCell>${customer.balance.toFixed(2)}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()} className="space-x-2">
                              <Button size="sm" onClick={() => handleVerifyCustomer(customer.id)}>
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => { setRejectId(customer.id); setRejectOpen(true); }}
                              >
                                Reject
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              {activeTab === 'low-balance' && (
                <div>
                  <CardHeader>
                    <CardTitle>Low Balance Customers</CardTitle>
                    <CardDescription>Customers with balance below $100</CardDescription>
                  </CardHeader>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Device ID</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowBalanceCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-500">
                            No low balance customers
                          </TableCell>
                        </TableRow>
                      ) : (
                        lowBalanceCustomers.map((customer) => (
                          <TableRow 
                            key={customer.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => router.push(`/admin/customers/${customer.id}`)}
                          >
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell className="font-mono text-sm">{customer.deviceId || 'N/A'}</TableCell>
                            <TableCell className="text-red-600 font-bold">${customer.balance.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={customer.isVerified ? "default" : "secondary"}>
                                {customer.isVerified ? "Verified" : "Pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Reject Dialog */}
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
    </div>
  );
}
