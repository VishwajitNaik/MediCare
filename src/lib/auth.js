import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const verifyToken = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const requireAuth = async (role = null) => {
  const user = await verifyToken();
  console.log("user token", user);
  
  if (!user) {
    throw new Error('Unauthorized');
  }
  if (role && user.role !== role) {
    throw new Error('Forbidden');
  }
  return user;
};
