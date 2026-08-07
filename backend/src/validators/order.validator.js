import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['online', 'cod']),
    shippingAddress: z.object({
      street: z.string().min(1, "Street is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      zipCode: z.union([z.string(), z.number()]).transform((val) => String(val)),
      country: z.string().min(1, "Country is required"),
      phone: z.string().min(1, "Phone is required")
    })
  })
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']),
    message: z.string().min(1, "Status update message is required")
  })
});
