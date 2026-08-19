import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Printer, CreditCard, Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/Badge';
import { saveBillChanges, printBill, recordPayment } from '../../features/workflows/cashierWorkflow';
import { toast } from 'sonner';
import { cn } from '../../utils/cn';

export function CashierBillDetails() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const bill = useSelector(state => state.billing.data.find(b => b.id === billId));
  const table = useSelector(state => state.tables.data.find(t => t.id === bill?.tableId));
  const menuItems = useSelector(state => state.menu.items);
  const users = useSelector(state => state.users.data);
  const waiter = users.find(u => u.id === bill?.waiterId);

  const [items, setItems] = useState([]);
  const [discountType, setDiscountType] = useState('PERCENT'); // 'PERCENT' | 'AMOUNT'
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  
  const settings = useSelector(state => state.restaurant.data?.settings) || {};
  const activePaymentMethods = settings.paymentMethods || { CASH: true, UPI: true, CARD: false };
  const restaurantName = useSelector(state => state.restaurant.data?.name) || 'NS Resto Cafe';
  const restaurantAddress = useSelector(state => state.restaurant.data?.address) || '123 Main Street, Food District';
  const restaurantPhone = useSelector(state => state.restaurant.data?.phone) || '+91 9876543210';
  
  useEffect(() => {
    if (activePaymentMethods.CASH) setPaymentMethod('CASH');
    else if (activePaymentMethods.UPI) setPaymentMethod('UPI');
  }, [activePaymentMethods.CASH, activePaymentMethods.UPI]);
  
  const receiptRef = useRef();

  useEffect(() => {
    if (bill) {
      setItems(bill.items.map(i => {
        const rate = i.billRate ?? i.unitPrice ?? i.price ?? 0;
        return {
          ...i,
          unitPrice: i.unitPrice ?? i.price ?? 0,
          billRate: rate,
          lineTotal: i.lineTotal ?? (i.quantity * rate)
        };
      }));
      setDiscountType(bill.discountPercentage > 0 ? 'PERCENT' : 'AMOUNT');
      setDiscountValue(bill.discountPercentage > 0 ? bill.discountPercentage : bill.discountAmount);
    }
  }, [bill]);

  const [paymentAmount, setPaymentAmount] = useState('');

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    
    let discountAmount = 0;
    let discountPercentage = 0;
    
    const val = parseFloat(discountValue) || 0;
    
    if (discountType === 'PERCENT') {
      discountPercentage = val;
      discountAmount = (subtotal * val) / 100;
    } else {
      discountAmount = val;
    }
    
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
      if (discountType === 'AMOUNT') setDiscountValue(subtotal);
    }
    
    const taxAmount = ((subtotal - discountAmount) * (bill?.taxRate ?? 5)) / 100;
    const grandTotal = subtotal - discountAmount + taxAmount;
    
    return { subtotal, discountPercentage, discountAmount, taxAmount, grandTotal };
  };

  const totals = calculateTotals();

  useEffect(() => {
    if (bill && paymentModalOpen) {
      setPaymentAmount((totals.grandTotal ?? 0).toFixed(2));
    }
  }, [paymentModalOpen, bill, totals.grandTotal]);

  if (!bill) return <div className="p-8 text-center text-text-muted">Bill not found</div>;
  const isLocked = bill.status === 'PRINTED' || bill.status === 'PAID';

  const handleRateChange = (index, newRate) => {
    if (isLocked) return;
    const rate = parseFloat(newRate) || 0;
    const newItems = [...items];
    newItems[index].billRate = rate;
    newItems[index].lineTotal = rate * newItems[index].quantity;
    setItems(newItems);
  };

  const handleSaveChanges = () => {
    if (isLocked) return;
    dispatch(saveBillChanges(bill.id, items, totals.discountPercentage, totals.discountAmount, totals.taxAmount, totals.grandTotal, currentUser.id));
    toast.success('Bill saved successfully');
  };

  const handlePrint = () => {
    if (bill.status === 'REQUESTED') {
      dispatch(printBill(bill.id, currentUser.id));
    }
    toast.success('Printing receipt...');
    // Real implementation would send to printer
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (!amount || amount < totals.grandTotal) {
      toast.error('Invalid payment amount');
      return;
    }
    dispatch(recordPayment(bill.id, paymentMethod, amount, currentUser.id));
    toast.success('Payment recorded successfully');
    setPaymentModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-canvas max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 flex items-center justify-between border-b border-border bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/cashier/bills')} className="p-2 -ml-2 text-text-muted hover:text-text-main">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-main">Bill {bill.billNumber}</h1>
              <StatusPill status={bill.status} />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isLocked && (
            <Button variant="outline" onClick={handleSaveChanges} className="font-bold">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          )}
          <Button variant="outline" onClick={handlePrint} className="font-bold">
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>
          {bill.status !== 'PAID' && (
            <Button onClick={() => setPaymentModalOpen(true)} className="font-bold shadow-md shadow-primary/20">
              <CreditCard className="w-4 h-4 mr-2" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: Billing Editor */}
        <div className="w-full lg:w-3/5 p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface/50">
              <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">Edit Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted">
                    <th className="font-semibold py-3 px-5">Item</th>
                    <th className="font-semibold py-3 px-5 text-center">Qty</th>
                    <th className="font-semibold py-3 px-5 text-right">Original</th>
                    <th className="font-semibold py-3 px-5 text-right">Final Rate</th>
                    <th className="font-semibold py-3 px-5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, index) => {
                    const menuItem = menuItems.find(m => m.id === item.menuItemId);
                    return (
                      <tr key={item.id} className="hover:bg-surface/30">
                        <td className="py-3 px-5 font-semibold text-text-main">{menuItem?.name}</td>
                        <td className="py-3 px-5 text-center font-bold text-text-muted">{item.quantity}</td>
                        <td className="py-3 px-5 text-right text-text-sub">₹{(item.unitPrice ?? item.price ?? 0).toFixed(2)}</td>
                        <td className="py-3 px-5 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.billRate}
                            onChange={(e) => handleRateChange(index, e.target.value)}
                            disabled={isLocked}
                            className="w-24 text-right border border-border rounded-lg px-2 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-surface disabled:text-text-muted"
                          />
                        </td>
                        <td className="py-3 px-5 text-right font-bold text-text-main">
                          ₹{(item.lineTotal ?? 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface/50">
              <h2 className="text-sm font-bold text-text-main uppercase tracking-wider">Discounts & Adjustments</h2>
            </div>
            <div className="p-5 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Type</label>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    setDiscountValue(0);
                  }}
                  disabled={isLocked}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface"
                >
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="AMOUNT">Flat Amount (₹)</option>
                </select>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Value</label>
                <input
                  type="number"
                  min="0"
                  max={discountType === 'PERCENT' ? '100' : totals.subtotal}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={isLocked}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface"
                />
              </div>
              <div className="flex-[2] space-y-1">
                <label className="text-xs font-bold text-text-muted uppercase">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Staff Discount"
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  disabled={isLocked}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface"
                />
              </div>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Receipt Preview */}
        <div className="hidden lg:block w-2/5 border-l border-border bg-surface overflow-y-auto custom-scrollbar p-6">
          <div className="bg-white border border-border rounded-xl shadow-sm p-8 max-w-sm mx-auto font-mono text-sm" ref={receiptRef}>
            <div className="text-center mb-6 border-b border-dashed border-border pb-6">
              <h2 className="text-xl font-bold text-text-main tracking-tight">{restaurantName}</h2>
              <p className="text-text-muted text-xs mt-1">{restaurantAddress}</p>
              <p className="text-text-muted text-xs">{restaurantPhone}</p>
            </div>
            
            <div className="mb-6 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-text-muted">Bill No:</span> <span className="font-bold">{bill.billNumber}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Order No:</span> <span>{bill.orderId}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Date:</span> <span>{new Date(bill.createdAt).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Time:</span> <span>{new Date(bill.createdAt).toLocaleTimeString()}</span></div>
              {table && <div className="flex justify-between"><span className="text-text-muted">Table:</span> <span>{table.tableNumber}</span></div>}
              {waiter && <div className="flex justify-between"><span className="text-text-muted">Waiter:</span> <span>{waiter.name}</span></div>}
            </div>
            
            <div className="border-t border-b border-dashed border-border py-3 mb-4">
              <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-wider text-text-muted">
                <span className="flex-1">Item</span>
                <span className="w-12 text-center">Qty</span>
                <span className="w-16 text-right">Amt</span>
              </div>
              <div className="space-y-2">
                {items.map((item) => {
                  const menuItem = menuItems.find(m => m.id === item.menuItemId);
                  return (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span className="flex-1 pr-2 truncate">{menuItem?.name}</span>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <span className="w-16 text-right">{(item.lineTotal ?? 0).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-text-muted">Subtotal:</span> <span>{(totals.subtotal ?? 0).toFixed(2)}</span></div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between"><span className="text-text-muted">Discount:</span> <span>-{(totals.discountAmount ?? 0).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-text-muted">Tax (5%):</span> <span>{(totals.taxAmount ?? 0).toFixed(2)}</span></div>
            </div>
            
            <div className="border-t border-dashed border-border mt-4 pt-4 flex justify-between items-center">
              <span className="text-sm font-bold uppercase tracking-wider">Grand Total</span>
              <span className="text-lg font-black tracking-tight text-text-main">₹{(totals.grandTotal ?? 0).toFixed(2)}</span>
            </div>
            
            <div className="text-center mt-8 text-xs text-text-muted uppercase tracking-widest font-bold">
              Thank You!
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-surface/50">
              <h2 className="text-lg font-bold text-text-main">Record Payment</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="text-text-faint hover:text-text-main transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 flex-1">
              <div className="bg-primary/5 rounded-xl border border-primary/20 p-5 mb-6 text-center">
                <p className="text-sm font-bold text-primary/80 uppercase tracking-wider mb-1">Amount Due</p>
                <p className="text-4xl font-black text-primary tracking-tight">₹{(totals.grandTotal ?? 0).toFixed(2)}</p>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(activePaymentMethods).map(([method, isActive]) => {
                      if (!isActive) return null;
                      const selected = paymentMethod === method;
                      return (
                        <div 
                          key={method}
                          onClick={() => setPaymentMethod(method)}
                          className={cn(
                            "py-3 rounded-xl border-2 text-center cursor-pointer transition-all font-bold",
                            selected ? "border-primary bg-primary/10 text-primary" : "border-border text-text-sub hover:border-border-strong"
                          )}
                        >
                          {method}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Tendered Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={totals.grandTotal}
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full border-2 border-border rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-primary focus:ring-0 transition-colors"
                  />
                </div>
                
                <Button type="submit" className="w-full py-4 text-base font-bold shadow-md shadow-primary/20 rounded-xl">
                  Confirm Payment
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
