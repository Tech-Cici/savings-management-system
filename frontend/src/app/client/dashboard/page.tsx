'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth-context';
import { useRouter } from 'next/navigation';
import { apiService, Transaction } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, AlertTriangle, Plus, Minus, History, User, LogOut, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ClientDashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== 'client') {
      router.push('/client/login');
      return;
    }
    loadDashboardData();
  }, [loading, user, router]);

  const loadDashboardData = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        apiService.getClientBalance(),
        apiService.getClientTransactions()
      ]);
      
      setBalance(balanceData.balance);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.deposit(amount, description);
      setSuccess('Deposit successful!');
      setDepositAmount('');
      setDescription('');
      setDepositOpen(false);
      loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > balance) {
      setError('Insufficient balance');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiService.withdraw(amount, description);
      setSuccess('Withdrawal successful!');
      setWithdrawAmount('');
      setDescription('');
      setWithdrawOpen(false);
      loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setActionLoading(false);
    }
  };

  const isLowBalance = balance < 100;
  const deposits = transactions.filter(t => t.type === 'deposit');
  const withdrawals = transactions.filter(t => t.type === 'withdrawal');
  const filteredTransactions = activeTab === 'deposits' 
    ? deposits 
    : activeTab === 'withdrawals' 
    ? withdrawals 
    : transactions;

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
            <DollarSign className="h-6 w-6 text-accent" />
            <h2 className="text-lg font-semibold">Savings Manager</h2>
          </div>
          <div className="text-sm text-gray-500">{user?.name}</div>
        </div>
        
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'all' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-gray-100'
            }`}
          >
            <History className="h-5 w-5" />
            <span>All Transactions</span>
            <Badge className="ml-auto">{transactions.length}</Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('deposits')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'deposits' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Deposits</span>
            <Badge className="ml-auto">{deposits.length}</Badge>
          </button>
          
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              activeTab === 'withdrawals' 
                ? 'bg-accent text-accent-foreground' 
                : 'hover:bg-gray-100'
            }`}
          >
            <TrendingDown className="h-5 w-5" />
            <span>Withdrawals</span>
            <Badge className="ml-auto">{withdrawals.length}</Badge>
          </button>

          <div className="pt-4 border-t mt-4">
            <Link href="/client/profile">
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
          <h1 className="text-2xl font-bold">Client Dashboard</h1>
        </div>

        <div className="p-6">
          {/* Alerts */}
          {isLowBalance && (
            <Alert className="mb-6" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Low balance alert: Your balance is below $100. Consider making a deposit.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Balance Card - Always Visible */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Account Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 mb-4">
                ${balance.toFixed(2)}
              </div>
              <div className="flex space-x-4">
                <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Deposit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make a Deposit</DialogTitle>
                      <DialogDescription>
                        Enter the amount you want to deposit to your account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="depositAmount">Amount</Label>
                        <Input
                          id="depositAmount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="depositDescription">Description (Optional)</Label>
                        <Textarea
                          id="depositDescription"
                          placeholder="Enter a description for this deposit"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={actionLoading} className="w-full">
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Deposit
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Deposit</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to deposit ${'{'}parseFloat(depositAmount || '0').toFixed(2){'}'}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeposit}>Yes, Deposit</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Minus className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make a Withdrawal</DialogTitle>
                      <DialogDescription>
                        Enter the amount you want to withdraw from your account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="withdrawAmount">Amount</Label>
                        <Input
                          id="withdrawAmount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="withdrawDescription">Description (Optional)</Label>
                        <Textarea
                          id="withdrawDescription"
                          placeholder="Enter a description for this withdrawal"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button disabled={actionLoading} className="w-full">
                            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Withdrawal
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirm Withdrawal</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to withdraw ${'{'}parseFloat(withdrawAmount || '0').toFixed(2){'}'}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleWithdraw}>Yes, Withdraw</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Content by Tab */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                {activeTab === 'deposits' ? 'Deposits' : activeTab === 'withdrawals' ? 'Withdrawals' : 'All Transactions'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'deposits' 
                  ? 'Your deposit history' 
                  : activeTab === 'withdrawals' 
                  ? 'Your withdrawal history' 
                  : 'View all your deposits and withdrawals'}
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
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    [...filteredTransactions]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((transaction) => (
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
                            <Badge 
                              variant={
                                transaction.status === 'completed' ? 'default' : 
                                transaction.status === 'failed' ? 'destructive' : 'secondary'
                              }
                            >
                              {transaction.status}
                            </Badge>
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
  );
}
