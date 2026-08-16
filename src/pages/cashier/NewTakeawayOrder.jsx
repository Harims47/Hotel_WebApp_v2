import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Plus, Minus, Send } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { createTakeawayOrder } from '../../features/workflows/cashierWorkflow';
import { cn } from '../../utils/cn';

export function NewTakeawayOrder() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentUser } = useSelector(state => state.auth);
  const menuCategories = useSelector(state => state.menu.categories);
  const menuItems = useSelector(state => state.menu.items);
  
  const activeCategories = useMemo(() => menuCategories.filter(c => !c.status || c.status === 'ACTIVE'), [menuCategories]);
  const [activeCategory, setActiveCategory] = useState(activeCategories[0]?.id);
  const [cart, setCart] = useState([]);
  
  const [source, setSource] = useState('OFFLINE');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState('CUSTOMER_PICKUP');
  const [addressLine, setAddressLine] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Coimbatore');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => item.categoryId === activeCategory && item.isAvailable !== false && (!item.status || item.status === 'ACTIVE'));
  }, [menuItems, activeCategory]);

  const handleAddToCart = (menuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === menuItem.id);
      if (existing) {
        return prev.map(i => i.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...menuItem, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const handleSendToKOT = () => {
    if (cart.length === 0) return;
    if (!customerName || !customerPhone) {
      alert("Customer Name and Phone are required for takeaway orders.");
      return;
    }
    if (fulfillmentType === 'DELIVERY' && (!addressLine || !area || !city)) {
      alert("Address Line, Area, and City are required for delivery.");
      return;
    }

    const address = fulfillmentType === 'DELIVERY' ? {
      addressLine, area, city, pincode, landmark
    } : null;
    
    dispatch(createTakeawayOrder(
      source,
      customerName,
      customerPhone,
      notes,
      cart,
      currentUser.id,
      fulfillmentType,
      address
    ));
    
    navigate('/cashier/takeaway');
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/cashier/takeaway')} className="mr-2">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-text-main">
          New Takeaway Order
        </h1>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Pane: Menu */}
        <div className="flex-1 flex flex-col bg-surface rounded-2xl border border-border overflow-hidden">
          {/* Categories */}
          <div className="flex overflow-x-auto p-4 border-b border-border space-x-2">
            {activeCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategory === cat.id ? "bg-primary text-white" : "bg-gray-100 text-text-main hover:bg-gray-200"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
            {filteredMenuItems.map(item => (
              <Card key={item.id} className="flex flex-col hover:border-primary transition-colors cursor-pointer" onClick={() => handleAddToCart(item)}>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-text-main">{item.name}</h3>
                    <p className="text-xs text-text-muted mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="font-bold text-primary">₹{item.price}</span>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Pane: Customer Details & Cart */}
        <div className="w-96 flex flex-col bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-border space-y-4">
            <h2 className="font-bold text-lg text-text-main">Order Details</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Source</label>
                <div className="flex space-x-2">
                  <button 
                    className={cn("flex-1 py-1.5 border rounded text-sm transition-colors", source === 'OFFLINE' ? "bg-primary text-white border-primary" : "bg-white text-text-main border-border")}
                    onClick={() => setSource('OFFLINE')}
                  >
                    OFFLINE
                  </button>
                  <button 
                    className={cn("flex-1 py-1.5 border rounded text-sm transition-colors", source === 'PHONE' ? "bg-primary text-white border-primary" : "bg-white text-text-main border-border")}
                    onClick={() => setSource('PHONE')}
                  >
                    PHONE
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Customer Name</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full border border-border rounded px-3 py-1.5 text-sm"
                  placeholder="Arun Kumar"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Customer Phone</label>
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full border border-border rounded px-3 py-1.5 text-sm"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Fulfillment</label>
                <div className="flex space-x-2">
                  <button 
                    className={cn("flex-1 py-1.5 border rounded text-sm transition-colors", fulfillmentType === 'CUSTOMER_PICKUP' ? "bg-primary text-white border-primary" : "bg-white text-text-main border-border")}
                    onClick={() => setFulfillmentType('CUSTOMER_PICKUP')}
                  >
                    CUSTOMER PICKUP
                  </button>
                  <button 
                    className={cn("flex-1 py-1.5 border rounded text-sm transition-colors", fulfillmentType === 'DELIVERY' ? "bg-primary text-white border-primary" : "bg-white text-text-main border-border")}
                    onClick={() => setFulfillmentType('DELIVERY')}
                  >
                    DELIVERY
                  </button>
                </div>
              </div>

              {fulfillmentType === 'DELIVERY' && (
                <div className="space-y-3 p-3 bg-white border border-border rounded">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Delivery Address</h3>
                  <div>
                    <input 
                      type="text" 
                      value={addressLine}
                      onChange={e => setAddressLine(e.target.value)}
                      className="w-full border border-border rounded px-3 py-1.5 text-sm mb-2"
                      placeholder="Address Line"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={area}
                      onChange={e => setArea(e.target.value)}
                      className="w-1/2 border border-border rounded px-3 py-1.5 text-sm"
                      placeholder="Area / Locality"
                    />
                    <input 
                      type="text" 
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-1/2 border border-border rounded px-3 py-1.5 text-sm"
                      placeholder="City"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={pincode}
                      onChange={e => setPincode(e.target.value)}
                      className="w-1/3 border border-border rounded px-3 py-1.5 text-sm"
                      placeholder="Pincode"
                    />
                    <input 
                      type="text" 
                      value={landmark}
                      onChange={e => setLandmark(e.target.value)}
                      className="w-2/3 border border-border rounded px-3 py-1.5 text-sm"
                      placeholder="Landmark"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Notes</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-border rounded px-3 py-1.5 text-sm"
                  placeholder="e.g. Less spicy"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-b border-border flex justify-between items-center">
            <h2 className="font-bold text-lg text-text-main">Current Order</h2>
            <span className="text-sm font-medium text-text-muted">{cart.length} Items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                <Send className="w-12 h-12 mb-2" />
                <p>No items added yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-text-main text-sm">{item.name}</p>
                      <p className="text-primary font-bold text-xs">₹{item.price * item.quantity}</p>
                    </div>
                    <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
                      <button onClick={() => handleUpdateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-text-muted">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-semibold text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-text-muted">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-4 border-t border-border bg-gray-50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-muted font-medium">Subtotal</span>
                <span className="text-lg font-bold text-text-main">₹{cartTotal}</span>
              </div>
              <Button onClick={handleSendToKOT} className="w-full h-12 text-lg">
                <Send className="w-5 h-5 mr-2" /> Send to KOT
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
