import { v4 as uuidv4 } from 'uuid';

export const SEED_RESTAURANT = {
  id: 'rest-1',
  name: 'NS Resto Cafe',
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
  // Starters (cat-1)
  { id: 'mi-1', categoryId: 'cat-1', name: 'Paneer Tikka', description: 'Tandoori paneer skewers', price: 220, image: 'https://loremflickr.com/400/300/food,starter?lock=1', isAvailable: true },
  { id: 'mi-2', categoryId: 'cat-1', name: 'Gobi Manchurian', description: 'Crispy cauliflower tossed in soy sauce', price: 180, image: 'https://loremflickr.com/400/300/food,starter?lock=2', isAvailable: true },
  { id: 'mi-3', categoryId: 'cat-1', name: 'Chicken 65', description: 'Spicy deep-fried chicken', price: 250, image: 'https://loremflickr.com/400/300/food,starter?lock=3', isAvailable: true },
  { id: 'mi-4', categoryId: 'cat-1', name: 'Chilli Paneer', description: 'Spicy paneer chunks in soy sauce', price: 200, image: 'https://loremflickr.com/400/300/food,starter?lock=4', isAvailable: true },
  { id: 'mi-5', categoryId: 'cat-1', name: 'Veg Manchurian', description: 'Vegetable dumplings in spicy sauce', price: 180, image: 'https://loremflickr.com/400/300/food,starter?lock=5', isAvailable: true },
  { id: 'mi-6', categoryId: 'cat-1', name: 'Spring Roll', description: 'Crispy rolls stuffed with vegetables', price: 150, image: 'https://loremflickr.com/400/300/food,starter?lock=6', isAvailable: true },
  { id: 'mi-7', categoryId: 'cat-1', name: 'Chicken Tikka', description: 'Classic tandoori chicken chunks', price: 260, image: 'https://loremflickr.com/400/300/food,starter?lock=7', isAvailable: true },
  { id: 'mi-8', categoryId: 'cat-1', name: 'Mutton Seekh Kebab', description: 'Minced mutton skewers cooked in tandoor', price: 320, image: 'https://loremflickr.com/400/300/food,starter?lock=8', isAvailable: true },
  { id: 'mi-9', categoryId: 'cat-1', name: 'Fish Tikka', description: 'Tandoori marinated fish cubes', price: 300, image: 'https://loremflickr.com/400/300/food,starter?lock=9', isAvailable: true },
  { id: 'mi-10', categoryId: 'cat-1', name: 'Mushroom Tikka', description: 'Tandoori mushrooms', price: 210, image: 'https://loremflickr.com/400/300/food,starter?lock=10', isAvailable: true },
  { id: 'mi-11', categoryId: 'cat-1', name: 'Hariyali Kebab', description: 'Green spinach and peas kebab', price: 230, image: 'https://loremflickr.com/400/300/food,starter?lock=11', isAvailable: true },
  { id: 'mi-12', categoryId: 'cat-1', name: 'Tandoori Chicken', description: 'Classic bone-in tandoori chicken', price: 280, image: 'https://loremflickr.com/400/300/food,starter?lock=12', isAvailable: true },

  // Main Course (cat-2)
  { id: 'mi-13', categoryId: 'cat-2', name: 'Butter Chicken', description: 'Chicken cooked in rich tomato gravy', price: 320, image: 'https://loremflickr.com/400/300/curry?lock=13', isAvailable: true },
  { id: 'mi-14', categoryId: 'cat-2', name: 'Paneer Butter Masala', description: 'Paneer in rich tomato gravy', price: 280, image: 'https://loremflickr.com/400/300/curry?lock=14', isAvailable: true },
  { id: 'mi-15', categoryId: 'cat-2', name: 'Dal Makhani', description: 'Slow-cooked black lentils', price: 240, image: 'https://loremflickr.com/400/300/curry?lock=15', isAvailable: true },
  { id: 'mi-16', categoryId: 'cat-2', name: 'Butter Naan', description: 'Tandoori flatbread with butter', price: 50, image: 'https://loremflickr.com/400/300/curry?lock=16', isAvailable: true },
  { id: 'mi-17', categoryId: 'cat-2', name: 'Tandoori Roti', description: 'Whole wheat tandoori bread', price: 30, image: 'https://loremflickr.com/400/300/curry?lock=17', isAvailable: true },
  { id: 'mi-18', categoryId: 'cat-2', name: 'Palak Paneer', description: 'Paneer in creamy spinach gravy', price: 260, image: 'https://loremflickr.com/400/300/curry?lock=18', isAvailable: true },
  { id: 'mi-19', categoryId: 'cat-2', name: 'Kadai Chicken', description: 'Chicken tossed with bell peppers and spices', price: 300, image: 'https://loremflickr.com/400/300/curry?lock=19', isAvailable: true },
  { id: 'mi-20', categoryId: 'cat-2', name: 'Mutton Rogan Josh', description: 'Classic Kashmiri mutton curry', price: 380, image: 'https://loremflickr.com/400/300/curry?lock=20', isAvailable: true },
  { id: 'mi-21', categoryId: 'cat-2', name: 'Mix Veg', description: 'Assorted seasonal vegetables', price: 220, image: 'https://loremflickr.com/400/300/curry?lock=21', isAvailable: true },
  { id: 'mi-22', categoryId: 'cat-2', name: 'Garlic Naan', description: 'Tandoori naan topped with garlic', price: 60, image: 'https://loremflickr.com/400/300/curry?lock=22', isAvailable: true },
  { id: 'mi-23', categoryId: 'cat-2', name: 'Lachha Paratha', description: 'Flaky layered wheat bread', price: 50, image: 'https://loremflickr.com/400/300/curry?lock=23', isAvailable: true },
  { id: 'mi-24', categoryId: 'cat-2', name: 'Malai Kofta', description: 'Potato and paneer dumplings in rich gravy', price: 270, image: 'https://loremflickr.com/400/300/curry?lock=24', isAvailable: true },

  // Biryani (cat-3)
  { id: 'mi-25', categoryId: 'cat-3', name: 'Chicken Biryani', description: 'Aromatic basmati rice with chicken', price: 280, image: 'https://loremflickr.com/400/300/biryani?lock=25', isAvailable: true },
  { id: 'mi-26', categoryId: 'cat-3', name: 'Mutton Biryani', description: 'Aromatic basmati rice with mutton', price: 350, image: 'https://loremflickr.com/400/300/biryani?lock=26', isAvailable: true },
  { id: 'mi-27', categoryId: 'cat-3', name: 'Veg Biryani', description: 'Aromatic basmati rice with mixed vegetables', price: 220, image: 'https://loremflickr.com/400/300/biryani?lock=27', isAvailable: true },
  { id: 'mi-28', categoryId: 'cat-3', name: 'Hyderabadi Chicken Biryani', description: 'Authentic dum biryani', price: 300, image: 'https://loremflickr.com/400/300/biryani?lock=28', isAvailable: true },
  { id: 'mi-29', categoryId: 'cat-3', name: 'Lucknowi Mutton Biryani', description: 'Awadhi style mild biryani', price: 360, image: 'https://loremflickr.com/400/300/biryani?lock=29', isAvailable: true },
  { id: 'mi-30', categoryId: 'cat-3', name: 'Paneer Biryani', description: 'Basmati rice cooked with paneer chunks', price: 240, image: 'https://loremflickr.com/400/300/biryani?lock=30', isAvailable: true },
  { id: 'mi-31', categoryId: 'cat-3', name: 'Egg Biryani', description: 'Spiced rice with boiled eggs', price: 230, image: 'https://loremflickr.com/400/300/biryani?lock=31', isAvailable: true },
  { id: 'mi-32', categoryId: 'cat-3', name: 'Fish Biryani', description: 'Aromatic rice with fish tikka', price: 320, image: 'https://loremflickr.com/400/300/biryani?lock=32', isAvailable: true },
  { id: 'mi-33', categoryId: 'cat-3', name: 'Prawn Biryani', description: 'Spiced prawn and basmati rice', price: 380, image: 'https://loremflickr.com/400/300/biryani?lock=33', isAvailable: true },
  { id: 'mi-34', categoryId: 'cat-3', name: 'Mushroom Biryani', description: 'Earthy mushroom and rice preparation', price: 250, image: 'https://loremflickr.com/400/300/biryani?lock=34', isAvailable: true },
  { id: 'mi-35', categoryId: 'cat-3', name: 'Kashmiri Pulao', description: 'Sweet pulao with nuts and fruits', price: 260, image: 'https://loremflickr.com/400/300/biryani?lock=35', isAvailable: true },
  { id: 'mi-36', categoryId: 'cat-3', name: 'Jeera Rice', description: 'Cumin flavored basmati rice', price: 150, image: 'https://loremflickr.com/400/300/biryani?lock=36', isAvailable: true },

  // Beverages (cat-4)
  { id: 'mi-37', categoryId: 'cat-4', name: 'Fresh Lime Soda', description: 'Refreshing lime drink', price: 90, image: 'https://loremflickr.com/400/300/beverage?lock=37', isAvailable: true },
  { id: 'mi-38', categoryId: 'cat-4', name: 'Sweet Lassi', description: 'Traditional yogurt-based drink', price: 110, image: 'https://loremflickr.com/400/300/beverage?lock=38', isAvailable: true },
  { id: 'mi-39', categoryId: 'cat-4', name: 'Coke', description: 'Coca Cola can', price: 60, image: 'https://loremflickr.com/400/300/beverage?lock=39', isAvailable: true },
  { id: 'mi-40', categoryId: 'cat-4', name: 'Salted Lassi', description: 'Salty yogurt-based drink', price: 110, image: 'https://loremflickr.com/400/300/beverage?lock=40', isAvailable: true },
  { id: 'mi-41', categoryId: 'cat-4', name: 'Mango Lassi', description: 'Yogurt drink flavored with mango', price: 130, image: 'https://loremflickr.com/400/300/beverage?lock=41', isAvailable: true },
  { id: 'mi-42', categoryId: 'cat-4', name: 'Buttermilk', description: 'Spiced thin yogurt drink', price: 70, image: 'https://loremflickr.com/400/300/beverage?lock=42', isAvailable: true },
  { id: 'mi-43', categoryId: 'cat-4', name: 'Cold Coffee', description: 'Classic iced blended coffee', price: 120, image: 'https://loremflickr.com/400/300/beverage?lock=43', isAvailable: true },
  { id: 'mi-44', categoryId: 'cat-4', name: 'Iced Tea', description: 'Lemon flavored cold tea', price: 100, image: 'https://loremflickr.com/400/300/beverage?lock=44', isAvailable: true },
  { id: 'mi-45', categoryId: 'cat-4', name: 'Water Bottle', description: 'Mineral water 1L', price: 40, image: 'https://loremflickr.com/400/300/beverage?lock=45', isAvailable: true },
  { id: 'mi-46', categoryId: 'cat-4', name: 'Sprite', description: 'Lemon lime soda can', price: 60, image: 'https://loremflickr.com/400/300/beverage?lock=46', isAvailable: true },
  { id: 'mi-47', categoryId: 'cat-4', name: 'Diet Coke', description: 'Zero calorie cola', price: 70, image: 'https://loremflickr.com/400/300/beverage?lock=47', isAvailable: true },
  { id: 'mi-48', categoryId: 'cat-4', name: 'Masala Chai', description: 'Hot Indian spiced tea', price: 50, image: 'https://loremflickr.com/400/300/beverage?lock=48', isAvailable: true },

  // Desserts (cat-5)
  { id: 'mi-49', categoryId: 'cat-5', name: 'Gulab Jamun', description: 'Deep-fried milk dumplings in sugar syrup', price: 90, image: 'https://loremflickr.com/400/300/dessert?lock=49', isAvailable: true },
  { id: 'mi-50', categoryId: 'cat-5', name: 'Rasmalai', description: 'Cottage cheese dumplings in sweetened milk', price: 120, image: 'https://loremflickr.com/400/300/dessert?lock=50', isAvailable: true },
  { id: 'mi-51', categoryId: 'cat-5', name: 'Vanilla Ice Cream', description: 'Classic vanilla ice cream', price: 100, image: 'https://loremflickr.com/400/300/dessert?lock=51', isAvailable: true },
  { id: 'mi-52', categoryId: 'cat-5', name: 'Chocolate Ice Cream', description: 'Rich chocolate ice cream', price: 110, image: 'https://loremflickr.com/400/300/dessert?lock=52', isAvailable: true },
  { id: 'mi-53', categoryId: 'cat-5', name: 'Strawberry Ice Cream', description: 'Strawberry flavored ice cream', price: 100, image: 'https://loremflickr.com/400/300/dessert?lock=53', isAvailable: true },
  { id: 'mi-54', categoryId: 'cat-5', name: 'Butterscotch Ice Cream', description: 'Crunchy butterscotch ice cream', price: 110, image: 'https://loremflickr.com/400/300/dessert?lock=54', isAvailable: true },
  { id: 'mi-55', categoryId: 'cat-5', name: 'Gajar Ka Halwa', description: 'Warm carrot pudding with nuts', price: 140, image: 'https://loremflickr.com/400/300/dessert?lock=55', isAvailable: true },
  { id: 'mi-56', categoryId: 'cat-5', name: 'Moong Dal Halwa', description: 'Rich lentil pudding', price: 150, image: 'https://loremflickr.com/400/300/dessert?lock=56', isAvailable: true },
  { id: 'mi-57', categoryId: 'cat-5', name: 'Kheer', description: 'Traditional rice pudding', price: 120, image: 'https://loremflickr.com/400/300/dessert?lock=57', isAvailable: true },
  { id: 'mi-58', categoryId: 'cat-5', name: 'Rabdi', description: 'Thickened sweetened milk', price: 130, image: 'https://loremflickr.com/400/300/dessert?lock=58', isAvailable: true },
  { id: 'mi-59', categoryId: 'cat-5', name: 'Kulfi', description: 'Indian style dense ice cream on a stick', price: 90, image: 'https://loremflickr.com/400/300/dessert?lock=59', isAvailable: true },
  { id: 'mi-60', categoryId: 'cat-5', name: 'Falooda', description: 'Layered dessert beverage with ice cream', price: 160, image: 'https://loremflickr.com/400/300/dessert?lock=60', isAvailable: true },
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
