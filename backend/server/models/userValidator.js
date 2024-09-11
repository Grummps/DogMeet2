const z = require('zod');

// Full user validation for registration or complete profile updates
const newUserValidation = data => {
  const registerValidationSchema = z.object({
    username: z.string().min(6, 'Username must be 6 characters or more'),
    email: z.string().email('Please input a valid email'),
    password: z.string().min(8, 'Password must be 8 or more characters').trim(),
    parkId: z.string().optional(),  // Optional field, validate as string if present
    dogId: z.string().optional(),   // Optional field, validate as string if present
    friends: z.array(z.string()).optional(),  // Optional array of strings (ObjectId)
    eventId: z.string().optional(),  // Optional field, validate as string if present
  });

  return registerValidationSchema.safeParse(data);
};

// Partial validation for when updating user details (e.g., only updating dogId)
const partialUserValidation = data => {
  const partialValidationSchema = z.object({
    username: z.string().min(6, 'Username must be 6 characters or more').optional(),
    email: z.string().email('Please input a valid email').optional(),
    password: z.string().min(8, 'Password must be 8 or more characters').trim().optional(),
    parkId: z.string().optional(),
    dogId: z.string().optional(),
    friends: z.array(z.string()).optional(),
    eventId: z.string().optional(),
  });

  return partialValidationSchema.safeParse(data);
};

// Login validation
const userLoginValidation = data => {
  const loginValidationSchema = z.object({
    username: z.string().min(6, 'Username must be 6 characters or more'),
    password: z.string().min(8, 'Password must be 8 or more characters').trim(),
  });
  return loginValidationSchema.safeParse(data);
};

module.exports = {
  newUserValidation,
  partialUserValidation,
  userLoginValidation
};

