import dotenv from 'dotenv';
dotenv.config();

const { razorpayCreateOrder } = await import('./src/config/razorpay.js');

try {
  const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const order = await razorpayCreateOrder({
    receipt: `order_${uuid.slice(0, 8)}_${Date.now()}`,
    amount: 349.5,
    currency: 'INR',
    notes: {
      customer_id:    uuid,
      customer_name:  'Real User Name',
      customer_email: 'realuser@example.com',
    },
  });
  console.log('SUCCESS', JSON.stringify(order, null, 2));
} catch (err) {
  console.log('ERROR', err.message);
  console.log('RESPONSE', JSON.stringify(err.razorpayResponse, null, 2));
}
