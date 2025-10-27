'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/store/auth-context';
import { useRouter } from 'next/navigation';
import { apiService, Transaction } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, TrendingUp, AlertTriangle, Plus, Minus, History } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [description, setDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'client') {
      router.push('/client/login');
      return;
    }
    loadDashboardData();
  }, [user, router]);

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
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Welcome, {user?.name}</span>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Balance Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Account Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              ${balance.toFixed(2)}
                </div>
            <div className="flex space-x-4 mt-4">
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
                    <Button onClick={handleDeposit} disabled={actionLoading} className="w-full">
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Deposit
                      </Button>
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
                    <Button onClick={handleWithdraw} disabled={actionLoading} className="w-full">
                      {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Withdraw
                      </Button>
                  </div>
                  </DialogContent>
                </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Transaction History
            </CardTitle>
            <CardDescription>
              View your recent deposits and withdrawals
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
                      No transactions yet
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
  );
}