import { v4 as uuidv4 } from 'uuid';

export const SEED_RESTAURANT = {
  id: 'rest-1',
  name: 'Sri Annapoorna',
  address: '123 Main Street, Food District',
  phone: '+91 9876543210',
  logo: '',
  currency: '₹',
  settings: {
    taxRate: 5
  }
};

export const SEED_USERS = [
  { id: 'u-1', name: 'Super Admin', username: 'superadmin', password: '123456', role: 'SUPER_ADMIN', phone: '9000000001', status: 'ACTIVE' },
  { id: 'u-2', name: 'General Manager', username: 'gm', password: '123456', role: 'GM', phone: '9000000002', status: 'ACTIVE' },
  { id: 'u-3', name: 'Rahul (Waiter)', username: 'waiter1', password: '123456', role: 'WAITER', phone: '9000000003', status: 'ACTIVE' },
  { id: 'u-4', name: 'Amit (Waiter)', username: 'waiter2', password: '123456', role: 'WAITER', phone: '9000000004', status: 'ACTIVE' },
  { id: 'u-5', name: 'Main Kitchen', username: 'kitchen', password: '123456', role: 'KOT', phone: '9000000005', status: 'ACTIVE' },
  { id: 'u-6', name: 'Front Desk Cashier', username: 'cashier', password: '123456', role: 'CASHIER', phone: '9000000006', status: 'ACTIVE' },
  { id: 'u-7', name: 'Raj (Delivery)', username: 'delivery', password: '123456', role: 'DELIVERY_BOY', phone: '9000000007', status: 'ACTIVE' },
  { id: 'u-8', name: 'Inventory Manager', username: 'inventory', password: '123456', role: 'INVENTORY_MANAGER', phone: '9000000008', status: 'ACTIVE' },
];

export const SEED_TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: `t-${i + 1}`,
  tableNumber: `T${String(i + 1).padStart(2, '0')}`,
  capacity: i < 4 ? 2 : i < 10 ? 4 : 6,
  section: i < 6 ? 'Main Hall' : 'Balcony',
  status: 'AVAILABLE',
}));

export const SEED_MENU_CATEGORIES = [
  { id: 'cat-1', name: 'Starters', description: 'Appetizers and snacks', displayOrder: 1, status: 'ACTIVE' },
  { id: 'cat-2', name: 'Main Course', description: 'Curries and breads', displayOrder: 2, status: 'ACTIVE' },
  { id: 'cat-3', name: 'Biryani', description: 'Rice dishes', displayOrder: 3, status: 'ACTIVE' },
  { id: 'cat-4', name: 'Beverages', description: 'Drinks and coolers', displayOrder: 4, status: 'ACTIVE' },
  { id: 'cat-5', name: 'Desserts', description: 'Sweets and ice creams', displayOrder: 5, status: 'ACTIVE' },
];

export const SEED_MENU_ITEMS = [
  { id: 'mi-1', categoryId: 'cat-1', name: 'Paneer Tikka', description: 'Tandoori paneer skewers', price: 220, image: '', isAvailable: true },
  { id: 'mi-2', categoryId: 'cat-1', name: 'Gobi Manchurian', description: 'Crispy cauliflower tossed in soy sauce', price: 180, image: '', isAvailable: true },
  { id: 'mi-3', categoryId: 'cat-1', name: 'Chicken 65', description: 'Spicy deep-fried chicken', price: 250, image: '', isAvailable: true },
  { id: 'mi-4', categoryId: 'cat-2', name: 'Butter Chicken', description: 'Chicken cooked in rich tomato gravy', price: 320, image: '', isAvailable: true },
  { id: 'mi-5', categoryId: 'cat-2', name: 'Paneer Butter Masala', description: 'Paneer in rich tomato gravy', price: 280, image: '', isAvailable: true },
  { id: 'mi-6', categoryId: 'cat-2', name: 'Dal Makhani', description: 'Slow-cooked black lentils', price: 240, image: '', isAvailable: true },
  { id: 'mi-7', categoryId: 'cat-2', name: 'Butter Naan', description: 'Tandoori flatbread with butter', price: 50, image: '', isAvailable: true },
  { id: 'mi-8', categoryId: 'cat-2', name: 'Tandoori Roti', description: 'Whole wheat tandoori bread', price: 30, image: '', isAvailable: true },
  { id: 'mi-9', categoryId: 'cat-3', name: 'Chicken Biryani', description: 'Aromatic basmati rice with chicken', price: 280, image: '', isAvailable: true },
  { id: 'mi-10', categoryId: 'cat-3', name: 'Mutton Biryani', description: 'Aromatic basmati rice with mutton', price: 350, image: '', isAvailable: true },
  { id: 'mi-11', categoryId: 'cat-3', name: 'Veg Biryani', description: 'Aromatic basmati rice with mixed vegetables', price: 220, image: '', isAvailable: true },
  { id: 'mi-12', categoryId: 'cat-4', name: 'Fresh Lime Soda', description: 'Refreshing lime drink', price: 90, image: '', isAvailable: true },
  { id: 'mi-13', categoryId: 'cat-4', name: 'Sweet Lassi', description: 'Traditional yogurt-based drink', price: 110, image: '', isAvailable: true },
  { id: 'mi-14', categoryId: 'cat-4', name: 'Coke', description: 'Coca Cola can', price: 60, image: '', isAvailable: true },
  { id: 'mi-15', categoryId: 'cat-5', name: 'Gulab Jamun', description: 'Deep-fried milk dumplings in sugar syrup', price: 90, image: '', isAvailable: true },
  { id: 'mi-16', categoryId: 'cat-5', name: 'Rasmalai', description: 'Cottage cheese dumplings in sweetened milk', price: 120, image: '', isAvailable: true },
  { id: 'mi-17', categoryId: 'cat-5', name: 'Vanilla Ice Cream', description: 'Classic vanilla ice cream', price: 100, image: '', isAvailable: true },
];

export const SEED_INV_CATEGORIES = [
  { id: 'ic-1', code: 'CAT-GRO', name: 'Grocery', description: 'General groceries', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'ic-2', code: 'CAT-VEG', name: 'Vegetables', description: 'Fresh vegetables', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'ic-3', code: 'CAT-FRU', name: 'Fruits', description: 'Fresh fruits', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'ic-4', code: 'CAT-MEA', name: 'Meat', description: 'Fresh meat & poultry', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'ic-5', code: 'CAT-DAI', name: 'Dairy', description: 'Milk and milk products', status: 'ACTIVE', createdAt: new Date().toISOString() },
];

export const SEED_INV_UOM = [
  { id: 'uom-1', code: 'KG', name: 'Kilogram', type: 'WEIGHT', status: 'ACTIVE' },
  { id: 'uom-2', code: 'GM', name: 'Gram', type: 'WEIGHT', status: 'ACTIVE' },
  { id: 'uom-3', code: 'LTR', name: 'Liter', type: 'VOLUME', status: 'ACTIVE' },
  { id: 'uom-4', code: 'ML', name: 'Milliliter', type: 'VOLUME', status: 'ACTIVE' },
  { id: 'uom-5', code: 'PCS', name: 'Pieces', type: 'COUNT', status: 'ACTIVE' },
  { id: 'uom-6', code: 'BOX', name: 'Box', type: 'PACKAGING', status: 'ACTIVE' },
  { id: 'uom-7', code: 'BAG', name: 'Bag', type: 'PACKAGING', status: 'ACTIVE' },
];

export const SEED_INV_LOCATIONS = [
  { id: 'loc-1', code: 'LOC-MAIN', name: 'Main Store', type: 'STORE', description: 'Primary central store', status: 'ACTIVE' },
  { id: 'loc-2', code: 'LOC-KIT', name: 'Kitchen Store', type: 'KITCHEN', description: 'Kitchen daily store', status: 'ACTIVE' },
  { id: 'loc-3', code: 'LOC-COLD', name: 'Cold Storage', type: 'COLD_STORAGE', description: 'Refrigerated storage', status: 'ACTIVE' },
];

export const SEED_INV_SUPPLIERS = [
  { id: 'sup-1', code: 'SUP-001', name: 'ABC Foods', contactPerson: 'John Doe', phone: '9876543210', email: 'john@abcfoods.com', address: '123 Market St', gstNumber: 'GST123456789', suppliedCategoryIds: ['ic-1'], status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'sup-2', code: 'SUP-002', name: 'Fresh Vegetables Supplier', contactPerson: 'Alice', phone: '9876543211', email: 'alice@freshveg.com', address: '456 Farm Road', gstNumber: 'GST987654321', suppliedCategoryIds: ['ic-2'], status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'sup-3', code: 'SUP-003', name: 'Sri Dairy Suppliers', contactPerson: 'Bob', phone: '9876543212', email: 'bob@sridairy.com', address: '789 Milk Ave', gstNumber: 'GST112233445', suppliedCategoryIds: ['ic-5'], status: 'ACTIVE', createdAt: new Date().toISOString() },
];

export const SEED_INV_ITEMS = [
  { id: 'inv-1', code: 'ITEM-001', name: 'Basmati Rice', categoryId: 'ic-1', baseUomId: 'uom-1', purchaseUomId: 'uom-7', conversionFactor: 25, reorderLevel: 75, minimumStock: 25, maximumStock: 200, preferredSupplierId: 'sup-1', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'inv-2', code: 'ITEM-002', name: 'Onion', categoryId: 'ic-2', baseUomId: 'uom-1', purchaseUomId: 'uom-1', conversionFactor: 1, reorderLevel: 50, minimumStock: 10, maximumStock: 100, preferredSupplierId: 'sup-2', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'inv-3', code: 'ITEM-003', name: 'Milk', categoryId: 'ic-5', baseUomId: 'uom-3', purchaseUomId: 'uom-3', conversionFactor: 1, reorderLevel: 25, minimumStock: 5, maximumStock: 50, preferredSupplierId: 'sup-3', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'inv-4', code: 'ITEM-004', name: 'Cooking Oil', categoryId: 'ic-1', baseUomId: 'uom-3', purchaseUomId: 'uom-3', conversionFactor: 1, reorderLevel: 30, minimumStock: 10, maximumStock: 100, preferredSupplierId: 'sup-1', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'inv-5', code: 'ITEM-005', name: 'Chicken', categoryId: 'ic-4', baseUomId: 'uom-1', purchaseUomId: 'uom-1', conversionFactor: 1, reorderLevel: 30, minimumStock: 15, maximumStock: 60, preferredSupplierId: 'sup-2', status: 'ACTIVE', createdAt: new Date().toISOString() },
];

export const SEED_INV_STOCK = [
  { id: 'stk-1', itemId: 'inv-1', locationId: 'loc-1', quantity: 40, uomId: 'uom-1', updatedAt: new Date().toISOString() }, // Low Stock
  { id: 'stk-2', itemId: 'inv-2', locationId: 'loc-1', quantity: 80, uomId: 'uom-1', updatedAt: new Date().toISOString() }, // Normal
  { id: 'stk-3', itemId: 'inv-3', locationId: 'loc-2', quantity: 40, uomId: 'uom-3', updatedAt: new Date().toISOString() }, // Normal
  { id: 'stk-4', itemId: 'inv-4', locationId: 'loc-1', quantity: 18, uomId: 'uom-3', updatedAt: new Date().toISOString() }, // Low Stock
  { id: 'stk-5', itemId: 'inv-5', locationId: 'loc-3', quantity: 12, uomId: 'uom-1', updatedAt: new Date().toISOString() }, // Low Stock
];

export const INITIAL_STATE = {
  restaurant: { data: SEED_RESTAURANT },
  users: { data: SEED_USERS },
  tables: { data: SEED_TABLES },
  menu: { categories: SEED_MENU_CATEGORIES, items: SEED_MENU_ITEMS },
  orders: { data: [] },
  kot: { data: [] },
  billing: { data: [] },
  payments: { data: [] },
  customers: { data: [] },
  delivery: { data: [] },
  notifications: { data: [] },
  audit: { data: [] },
  invCategories: { data: SEED_INV_CATEGORIES },
  invUom: { data: SEED_INV_UOM },
  invLocations: { data: SEED_INV_LOCATIONS },
  invSuppliers: { data: SEED_INV_SUPPLIERS },
  invItems: { data: SEED_INV_ITEMS },
  invStock: { data: SEED_INV_STOCK },
  purchaseOrders: { data: [] },
};
