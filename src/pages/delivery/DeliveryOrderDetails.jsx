import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ArrowLeft, MapPin, Phone, User, Package, Check, CreditCard, Banknote } from 'lucide-react';
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

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-3xl mx-auto w-full">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/delivery/orders')} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-text-main">
          Order {delivery.orderId.replace('ord-', 'ORD-').toUpperCase()}
        </h1>
        <Badge variant={delivery.status === 'OUT_FOR_DELIVERY' ? 'primary' : 'warning'} className="ml-4">
          {delivery.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-24">
        {/* Customer & Address Details */}
        <Card>
          <CardHeader className="bg-gray-50 border-b border-border pb-3">
            <h2 className="font-bold text-lg text-text-main flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-primary" /> Delivery Information
            </h2>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-text-muted" />
              <span className="font-medium text-text-main text-lg">{delivery.customerName}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-text-muted" />
              <span className="text-text-main">{delivery.customerPhone}</span>
            </div>
            <div className="flex items-start space-x-3 pt-2">
              <MapPin className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
              <div className="text-text-main">
                <p>{delivery.address}</p>
                <p>{delivery.area}, {delivery.city}</p>
                <p>PIN: {delivery.pincode}</p>
                {delivery.landmark && <p className="mt-1 text-text-muted text-sm border-l-2 border-primary pl-2">Landmark: {delivery.landmark}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="bg-gray-50 border-b border-border pb-3">
            <h2 className="font-bold text-lg text-text-main flex items-center">
              <Package className="w-5 h-5 mr-2 text-primary" /> Order Items
            </h2>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {order.items.map((item, idx) => {
                const mItem = menuItems.find(m => m.id === item.menuItemId);
                return (
                  <li key={idx} className="p-4 flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-primary mr-3">{item.quantity}×</span>
                      <span className="font-medium text-text-main">{mItem?.name || 'Item'}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        {/* Bill Summary */}
        <Card>
          <CardContent className="p-5 flex justify-between items-center bg-orange-50 border-orange-200">
            <span className="font-bold text-lg text-text-main">Final Amount to Collect</span>
            <span className="font-bold text-2xl text-primary">₹{bill?.grandTotal || 0}</span>
          </CardContent>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-border p-4 shadow-lg flex justify-center">
        <div className="w-full max-w-3xl">
          {delivery.status === 'ASSIGNED' && (
            <Button className="w-full h-14 text-lg" onClick={handlePickup}>
              Pickup Order from Restaurant
            </Button>
          )}
          
          {delivery.status === 'PICKED_UP' && (
            <Button className="w-full h-14 text-lg" onClick={handleStartDelivery}>
              Start Delivery
            </Button>
          )}

          {delivery.status === 'OUT_FOR_DELIVERY' && (
            <Button className="w-full h-14 text-lg" onClick={() => setShowPaymentModal(true)}>
              <Check className="w-6 h-6 mr-2" /> Mark Delivered
            </Button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-xl animate-in zoom-in-95">
            <CardHeader className="border-b border-border bg-gray-50 pb-4">
              <h2 className="text-xl font-bold text-text-main">Confirm Delivery</h2>
              <p className="text-text-muted text-sm mt-1">Record payment from customer to complete order.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="text-center bg-orange-50 rounded-lg p-4">
                <p className="text-text-muted text-sm mb-1">Amount to Collect</p>
                <p className="text-3xl font-bold text-primary">₹{bill?.grandTotal}</p>
              </div>
              
              <div className="space-y-3">
                <p className="font-medium text-text-main text-sm">Select Payment Method:</p>
                <Button 
                  variant="outline" 
                  className="w-full h-14 text-lg justify-start"
                  onClick={() => handleConfirmDelivery('CASH')}
                >
                  <Banknote className="w-5 h-5 mr-3" /> Cash
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-14 text-lg justify-start"
                  onClick={() => handleConfirmDelivery('UPI')}
                >
                  <CreditCard className="w-5 h-5 mr-3" /> UPI
                </Button>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
