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
};
