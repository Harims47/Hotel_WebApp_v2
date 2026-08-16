import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Printer, CreditCard, Save } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { saveBillChanges, printBill, recordPayment } from '../../features/workflows/cashierWorkflow';
import { toast } from 'sonner';

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
  const activePaymentMethods = settings.paymentMethods || { CASH: true, UPI: true };
  
  useEffect(() => {
    if (activePaymentMethods.CASH) setPaymentMethod('CASH');
    else if (activePaymentMethods.UPI) setPaymentMethod('UPI');
  }, [activePaymentMethods.CASH, activePaymentMethods.UPI]);
  
  const receiptRef = useRef();

  useEffect(() => {
    if (bill) {
      setItems(bill.items.map(i => ({ ...i })));
      setDiscountType(bill.discountPercentage > 0 ? 'PERCENT' : 'AMOUNT');
      setDiscountValue(bill.discountPercentage > 0 ? bill.discountPercentage : bill.discountAmount);
    }
  }, [bill]);

  const [paymentAmount, setPaymentAmount] = useState('');

  if (!bill) return <div>Bill not found</div>;

  const isLocked = bill.status === 'PRINTED' || bill.status === 'PAID';

  const handleRateChange = (index, newRate) => {
    if (isLocked) return;
    const rate = parseFloat(newRate) || 0;
    const newItems = [...items];
    newItems[index].billRate = rate;
    newItems[index].lineTotal = rate * newItems[index].quantity;
    setItems(newItems);
  };

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
    
    // Validations
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
      if (discountType === 'AMOUNT') setDiscountValue(subtotal);
    }
    
    const taxAmount = ((subtotal - discountAmount) * bill?.taxRate || 5) / 100;
    const grandTotal = subtotal - discountAmount + taxAmount;
    
    return { subtotal, discountPercentage, discountAmount, taxAmount, grandTotal };
  };

  const totals = calculateTotals();

  useEffect(() => {
    if (bill && paymentModalOpen) {
      setPaymentAmount(totals.grandTotal.toFixed(2));
    }
  }, [paymentModalOpen, bill, totals.grandTotal]);

  const handleSaveChanges = () => {
    if (isLocked) return;
    
    // Ensure discount reason if discount > 0
    if (totals.discountAmount > 0 && !discountReason) {
      alert("Please provide a reason for the discount.");
      return;
    }
    
    // Ensure rate reasons if changed
    const changedItems = items.filter(i => i.billRate !== i.originalRate);
    if (changedItems.length > 0 && !discountReason) { // using same reason field for simplicity as per requirements
      alert("Please provide a reason for manual rate adjustment in the discount reason field.");
      return;
    }
    
    dispatch(saveBillChanges(bill.id, currentUser.id, items, totals.discountAmount, totals.discountPercentage, discountReason));
    toast.success("Bill updated successfully");
  };

  const handlePrint = () => {
    if (bill.status === 'REQUESTED') {
      // automatically save before printing just in case
      handleSaveChanges();
    }
    dispatch(printBill(bill.id, currentUser.id));
    
    // Browser print simulation
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || Math.abs(amount - totals.grandTotal) > 0.01) {
      alert("Payment amount must exactly match the final bill total.");
      return;
    }
    dispatch(recordPayment(bill.id, paymentMethod, amount, currentUser.id));
    setPaymentModalOpen(false);
    toast.success("Payment recorded and Order closed.");
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cashier/bills')} className="mr-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-text-main">
            Bill Details
          </h1>
          <Badge variant={bill.status === 'PAID' ? 'success' : bill.status === 'PRINTED' ? 'primary' : 'warning'} className="ml-4">
            {bill.status}
          </Badge>
        </div>
        
        <div className="flex space-x-3 hide-print">
          {!isLocked && (
            <Button onClick={handleSaveChanges} variant="outline">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          )}
          
          {bill.status !== 'PAID' && (
            <Button onClick={handlePrint} className={!isLocked ? "bg-primary text-white hover:bg-orange-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}>
              <Printer className="w-4 h-4 mr-2" /> Print Receipt
            </Button>
          )}
          
          {bill.status === 'PRINTED' && (
            <Button onClick={() => setPaymentModalOpen(true)} className="bg-status-success hover:bg-green-600 text-white">
              <CreditCard className="w-4 h-4 mr-2" /> Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Editor (Hide when printing) */}
        <div className="lg:col-span-2 space-y-6 hide-print">
          <Card className="border border-border">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold mb-4">Edit Items</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-text-muted">
                    <tr>
                      <th className="px-4 py-2 rounded-l-lg">Item</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">Original</th>
                      <th className="px-4 py-2">Final Rate</th>
                      <th className="px-4 py-2 rounded-r-lg text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const mItem = menuItems.find(m => m.id === item.menuItemId);
                      return (
                        <tr key={item.id} className="border-b border-gray-100 last:border-0">
                          <td className="px-4 py-3 font-medium text-text-main">{mItem?.name}</td>
                          <td className="px-4 py-3">{item.quantity}</td>
                          <td className="px-4 py-3 text-text-muted">₹{item.originalRate}</td>
                          <td className="px-4 py-3">
                            <input 
                              type="number"
                              min="0"
                              value={item.billRate}
                              onChange={(e) => handleRateChange(index, e.target.value)}
                              disabled={isLocked}
                              className="w-24 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary disabled:bg-gray-100"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium">₹{item.lineTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {!isLocked && (
            <Card className="border border-border">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4">Discounts & Adjustments</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Discount Type</label>
                    <select 
                      value={discountType} 
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2"
                    >
                      <option value="PERCENT">Percentage (%)</option>
                      <option value="AMOUNT">Flat Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-1">Discount Value</label>
                    <input 
                      type="number" 
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-muted mb-1">Adjustment Reason (Required if discounted/modified)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Manager approved, Customer complaint"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      className="w-full border border-border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Side: Receipt Preview */}
        <div className="lg:col-span-1 printable-area" ref={receiptRef}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 max-w-sm mx-auto font-mono text-sm">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Sri Annapoorna</h2>
              <p className="text-gray-500">123 Main Street, Food District</p>
              <p className="text-gray-500">+91 9876543210</p>
            </div>
            
            <div className="border-t border-b border-gray-200 py-3 mb-4 space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Bill:</span> <span className="font-medium">{bill.billNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Order:</span> <span>{bill.orderId.substring(0, 12)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Table:</span> <span>{table?.tableNumber || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Waiter:</span> <span>{waiter?.name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date:</span> <span>{new Date(bill.createdAt).toLocaleDateString()} {new Date(bill.createdAt).toLocaleTimeString()}</span></div>
            </div>

            <div className="mb-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const mItem = menuItems.find(m => m.id === item.menuItemId);
                    return (
                      <tr key={item.id}>
                        <td className="py-2 pr-2">{mItem?.name} {item.billRate !== item.originalRate && <span className="text-xs block text-gray-400">(Rate: ₹{item.billRate})</span>}</td>
                        <td className="py-2 text-center align-top">{item.quantity}</td>
                        <td className="py-2 text-right align-top">₹{item.lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{totals.subtotal.toFixed(2)}</span>
              </div>
              
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-gray-900">
                  <span>Discount {discountType === 'PERCENT' ? `(${totals.discountPercentage}%)` : ''}</span>
                  <span>-₹{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-500">Tax ({bill.taxRate}%)</span>
                <span>₹{totals.taxAmount.toFixed(2)}</span>
              </div>
              
              <div className="border-t border-gray-800 pt-3 mt-3 flex justify-between font-bold text-lg">
                <span>TOTAL</span>
                <span>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 text-center text-gray-500 text-xs">
              {bill.status === 'PAID' ? 'PAID - THANK YOU' : 'PLEASE PAY AT COUNTER'}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center hide-print">
          <Card className="w-[400px]">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">Record Payment</h2>
              <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-between items-center border border-border">
                <span className="font-semibold text-text-main">Amount to Pay:</span>
                <span className="text-2xl font-bold text-primary">₹{totals.grandTotal.toFixed(2)}</span>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-text-main mb-1">Enter Amount Received</label>
                  <input 
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2"
                    step="0.01"
                  />
                </div>
                
                <label className="block text-sm font-medium text-text-main mt-4">Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                  {activePaymentMethods?.CASH && (
                    <button 
                      className={`p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'CASH' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-muted hover:border-gray-300'}`}
                      onClick={() => setPaymentMethod('CASH')}
                    >
                      CASH
                    </button>
                  )}
                  {activePaymentMethods?.UPI && (
                    <button 
                      className={`p-3 rounded-lg border-2 font-semibold transition-colors ${paymentMethod === 'UPI' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-text-muted hover:border-gray-300'}`}
                      onClick={() => setPaymentMethod('UPI')}
                    >
                      UPI
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
                <Button className="bg-status-success hover:bg-green-600 text-white" onClick={handleRecordPayment}>
                  Confirm Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Styles for printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .hide-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
