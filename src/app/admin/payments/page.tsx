"use client";

import React, { useState, useEffect } from "react";
import { IndianRupee, Loader2, ChevronLeft, ChevronRight, Filter, TrendingUp, CreditCard, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface PaymentData {
  _id: string;
  userId: { name?: string; email: string } | null;
  razorpayPaymentId: string;
  razorpayOrderId?: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, totalCount: 0, totalPages: 0 });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPlan, setFilterPlan] = useState("");

  const fetchPayments = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterStatus) params.set('status', filterStatus);
      if (filterPlan) params.set('plan', filterPlan);

      const res = await fetch(`/api/admin/payments?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments);
        setPagination(data.pagination);
        setTotalRevenue(data.totalRevenue);
        setTotalPayments(data.totalPayments);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(1);
  }, [filterStatus, filterPlan]);

  const handleStatusChange = async (paymentId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: newStatus }),
      });
      if (res.ok) {
        setPayments(prev => prev.map(p => p._id === paymentId ? { ...p, status: newStatus } : p));
        toast.success("Payment status updated");
      } else {
        toast.error("Failed to update payment status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8 relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-foreground dark:text-white mb-2 tracking-tight">Payment Management</h1>
        <p className="text-muted-foreground dark:text-[#8A8985]">View all payments, revenue analytics, and manage payment statuses.</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
              <IndianRupee size={22} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-white">₹{totalRevenue.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground dark:text-[#8A8985]">Total Revenue</div>
        </div>
        <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CreditCard size={22} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-white">{totalPayments}</div>
          <div className="text-sm text-muted-foreground dark:text-[#8A8985]">Total Transactions</div>
        </div>
        <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary dark:bg-[#C36A4F]/10 dark:text-[#C36A4F]">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="text-2xl font-bold text-foreground dark:text-white">
            ₹{totalPayments > 0 ? Math.round(totalRevenue / totalPayments).toLocaleString() : 0}
          </div>
          <div className="text-sm text-muted-foreground dark:text-[#8A8985]">Avg Transaction</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Filter size={16} className="text-muted-foreground" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-card dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-lg px-3 py-1.5 text-sm text-foreground dark:text-[#E6E4DF] focus:outline-none focus:border-primary"
        >
          <option value="">All Statuses</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="bg-card dark:bg-[#1A1918] border border-border dark:border-[#33312E] rounded-lg px-3 py-1.5 text-sm text-foreground dark:text-[#E6E4DF] focus:outline-none focus:border-primary"
        >
          <option value="">All Plans</option>
          <option value="pro">Pro</option>
          <option value="ultimate">Ultimate</option>
        </select>
      </div>

      {/* Payments Table */}
      <div className="bg-card dark:bg-[#262523]/50 border border-border dark:border-[#33312E] rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CreditCard size={40} className="mb-4 opacity-30" />
            <p>No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 dark:bg-[#1A1918] text-muted-foreground dark:text-[#8A8985] uppercase text-[11px] tracking-wider font-semibold border-b border-border dark:border-[#33312E]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Payment ID</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 dark:divide-[#33312E]/50">
                {payments.map((payment) => (
                  <tr key={payment._id} className="hover:bg-accent/50 dark:hover:bg-[#32302D]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground dark:text-[#E6E4DF]">
                          {payment.userId?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground dark:text-[#73726E]">
                          {payment.userId?.email || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider ${
                        payment.plan === 'ultimate' ? 'bg-primary/20 text-primary dark:bg-[#C36A4F]/20 dark:text-[#ff8d6e]' :
                        'bg-blue-500/20 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                      }`}>
                        {payment.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-foreground dark:text-[#E6E4DF]">
                      ₹{(payment.amount / 100).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={payment.status}
                        onChange={(e) => handleStatusChange(payment._id, e.target.value)}
                        className={`appearance-none cursor-pointer px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border-0 outline-none ${
                          payment.status === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                          payment.status === 'refunded' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                          payment.status === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        <option value="success">Success</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-muted-foreground dark:text-[#8A8985]">
                      {payment.razorpayPaymentId?.substring(0, 20) || "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground dark:text-[#8A8985]">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && payments.length > 0 && (
          <div className="p-4 border-t border-border dark:border-[#33312E] flex items-center justify-between">
            <span className="text-xs text-muted-foreground dark:text-[#73726E]">
              Showing {payments.length} of {pagination.totalCount} payments
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPayments(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg border border-border dark:border-[#33312E] hover:bg-accent dark:hover:bg-[#363532] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-muted-foreground">
                {pagination.page} / {pagination.totalPages || 1}
              </span>
              <button
                onClick={() => fetchPayments(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-border dark:border-[#33312E] hover:bg-accent dark:hover:bg-[#363532] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
