import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, MapPin, Phone, User, Package, Check, CreditCard, Banknote, Play, Map } from 'lucide-react';
import { pickupDeliveryOrder, startDelivery, confirmDelivery } from '../../features/workflows/deliveryWorkflow';

export function DeliveryOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const deliveryData = useSelector(state => state.delivery.data);
  const orders = useSelector(state => state.orders.data);
  const bills = useSelector(state => state.billing.data);
  const menuItems = useSelector(state => state.menu.items);

  const delivery = deliveryData.find(d => d.id === id);
  const order = delivery ? orders.find(o => o.id === delivery.orderId) : null;
  const bill = delivery ? bills.find(b => b.orderId === delivery.orderId) : null;

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const settings = useSelector(state => state.restaurant.data?.settings) || {};
  const activePaymentMethods = settings.paymentMethods || { CASH: true, UPI: true };

  if (!delivery || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-muted">
        <p>Delivery order not found or you don't have access.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/delivery/orders')}>Go Back</Button>
      </div>
    );
  }

  const handlePickup = () => {
    dispatch(pickupDeliveryOrder(delivery.id, currentUser.id));
  };

  const handleStartDelivery = () => {
    dispatch(startDelivery(delivery.id, currentUser.id));
  };

  const handleConfirmDelivery = (method) => {
    if (window.confirm(`Confirm delivery and record ₹${bill?.grandTotal} as paid via ${method}?`)) {
      dispatch(confirmDelivery(delivery.id, method, currentUser.id));
      setShowPaymentModal(false);
      navigate('/delivery/orders');
    }
  };

  const orderIdDisplay = order?.orderNumber || delivery.orderId.substring(0, 8).toUpperCase();

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-3xl mx-auto w-full bg-canvas">
      <div className="flex items-center p-4 md:p-6 bg-white border-b border-border/60 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate('/delivery/orders')} className="mr-3 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-text-main font-mono tracking-tight">
              {orderIdDisplay}
            </h1>
            <p className="text-xs font-semibold text-text-muted mt-0.5">Order Details</p>
          </div>
          <Badge variant={delivery.status === 'OUT_FOR_DELIVERY' ? 'primary' : 'warning'} className="font-bold px-3 py-1 ml-4 shadow-sm text-xs">
            {delivery.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 p-4 md:p-6 pb-32 custom-scrollbar">
        {/* Customer Info & Call Action */}
        <Card className="border-0 shadow-sm ring-1 ring-border overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-text-main leading-tight">{delivery.customerName}</p>
                  <p className="text-sm font-semibold text-text-muted mt-0.5">{delivery.customerPhone}</p>
                </div>
              </div>
              <a 
                href={`tel:${delivery.customerPhone}`}
                className="flex items-center justify-center h-12 px-6 rounded-xl bg-status-success text-white font-bold shadow-md shadow-green-500/20 hover:bg-green-600 transition-colors shrink-0"
              >
                <Phone className="w-5 h-5 mr-2" fill="currentColor" /> Call Customer
              </a>
            </div>
            
            <div className="p-5 bg-surface/50 border-t border-border/50">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-text-main text-sm mb-1">Delivery Address</h3>
                  {delivery.address ? (
                    <div className="text-text-main text-sm font-medium leading-relaxed">
                      <p>{delivery.address}</p>
                      <p>{delivery.area}, {delivery.city}</p>
                      <p>PIN: {delivery.pincode}</p>
                      {delivery.landmark && (
                        <p className="mt-2 text-text-muted text-xs font-semibold border-l-2 border-primary pl-2 py-0.5">Landmark: {delivery.landmark}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-status-warning text-sm font-semibold italic bg-yellow-50 px-3 py-2 rounded border border-yellow-100">
                      Address not provided yet. Please call the customer to confirm location.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="border-0 shadow-sm ring-1 ring-border">
          <CardHeader className="bg-white border-b border-border/50 pb-3 pt-4 px-5">
            <h2 className="font-bold text-sm text-text-muted uppercase tracking-wider flex items-center">
              <Package className="w-4 h-4 mr-2" /> Order Summary
            </h2>
          </CardHeader>
          <CardContent className="p-0 bg-white">
            <ul className="divide-y divide-border/50">
              {order.items.map((item, idx) => {
                const mItem = menuItems.find(m => m.id === item.menuItemId);
                return (
                  <li key={idx} className="p-4 px-5 flex justify-between items-center bg-white">
                    <div className="flex items-center min-w-0 pr-4">
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-sm mr-3 shrink-0">{item.quantity}×</span>
                      <span className="font-bold text-text-main text-sm truncate">{mItem?.name || 'Item'}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="p-5 flex justify-between items-center bg-gray-50 border-t border-border/50">
              <span className="font-bold text-text-main">Amount to Collect</span>
              <span className="font-black text-2xl text-primary">₹{bill?.grandTotal || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="absolute bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-border p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 flex justify-center pb-safe">
        <div className="w-full max-w-3xl flex items-center justify-center gap-4">
          {delivery.status === 'ASSIGNED' && (
            <Button className="w-full h-14 text-base font-black shadow-lg shadow-primary/20" onClick={handlePickup}>
              Pickup Order from Restaurant
            </Button>
          )}
          
          {delivery.status === 'PICKED_UP' && (
            <Button className="w-full h-14 text-base font-black shadow-lg shadow-primary/20" onClick={handleStartDelivery}>
              <Play className="w-5 h-5 mr-2" fill="currentColor" /> Start Delivery
            </Button>
          )}

          {delivery.status === 'OUT_FOR_DELIVERY' && (
            <Button className="w-full h-14 text-base font-black shadow-lg shadow-green-500/20 bg-status-success hover:bg-green-600 border-none text-white" onClick={() => setShowPaymentModal(true)}>
              <Check className="w-6 h-6 mr-2" /> Mark as Delivered
            </Button>
          )}
          
          {delivery.status === 'DELIVERED' && (
            <div className="w-full h-14 flex items-center justify-center bg-gray-100 rounded-xl border border-border/50 text-text-muted font-bold">
              <Check className="w-5 h-5 mr-2 text-status-success" /> Order Delivered
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 pb-safe">
          <Card className="w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 border-0 rounded-t-2xl sm:rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-white pb-4 pt-6">
              <h2 className="text-xl font-black text-text-main text-center">Confirm Delivery</h2>
              <p className="text-text-muted text-sm mt-1 text-center font-medium">Record payment from customer</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6 bg-gray-50/50">
              <div className="text-center bg-white rounded-xl p-6 border border-border/50 shadow-sm">
                <p className="text-text-muted text-sm mb-1 font-bold">Amount to Collect</p>
                <p className="text-4xl font-black text-primary">₹{bill?.grandTotal}</p>
              </div>
              
              <div className="space-y-3">
                <p className="font-bold text-text-muted text-xs uppercase tracking-wider mb-2">Select Payment Method</p>
                
                {activePaymentMethods?.CASH && (
                  <Button 
                    variant="outline" 
                    className="w-full h-14 text-base font-bold justify-start bg-white hover:bg-gray-50 border-border shadow-sm"
                    onClick={() => handleConfirmDelivery('CASH')}
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 shrink-0">
                      <Banknote className="w-4 h-4 text-green-700" />
                    </div>
                    Cash Payment
                  </Button>
                )}
                
                {activePaymentMethods?.UPI && (
                  <Button 
                    variant="outline" 
                    className="w-full h-14 text-base font-bold justify-start bg-white hover:bg-gray-50 border-border shadow-sm"
                    onClick={() => handleConfirmDelivery('UPI')}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 shrink-0">
                      <CreditCard className="w-4 h-4 text-blue-700" />
                    </div>
                    UPI / Online
                  </Button>
                )}
              </div>

              <div className="pt-2">
                <Button variant="ghost" className="w-full h-12 font-bold text-text-muted" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
