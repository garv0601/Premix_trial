import dotenv from 'dotenv';
dotenv.config();

const { cashfreeCreateOrder } = await import('./src/config/cashfree.js');

try {
  const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const order = await cashfreeCreateOrder({
    orderId: `order_${uuid.slice(0, 8)}_${Date.now()}`,
    amount: 349.5,
    currency: 'INR',
    customer: {
      id:    uuid,
      name:  'Real User Name',
      email: 'realuser@example.com',
      phone: undefined,
    },
    returnUrl: 'http://localhost:5173/order-confirmation',
  });
  console.log('SUCCESS', JSON.stringify(order, null, 2));
} catch (err) {
  console.log('ERROR', err.message);
  console.log('RESPONSE', JSON.stringify(err.cashfreeResponse, null, 2));
}
