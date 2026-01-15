import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebaseAdmin';

export interface FirebaseUser {
  uid: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface FirebaseRequest extends Request {
  firebaseUser?: FirebaseUser;
}

export const firebaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    // Attach both firebaseUser and req.user for downstream handlers
    (req as FirebaseRequest).firebaseUser = {
      uid: decoded.uid,
      email: decoded.email || undefined,
      phone: decoded.phone_number || undefined,
      name: decoded.name || decoded.email || undefined,
    };

    (req as any).user = {
      uid: decoded.uid,
      email: decoded.email,
      phone: decoded.phone_number,
      role: 'user'
    };

    return next();
  } catch (error: any) {
    console.error('Firebase token verification failed:', error?.message);
    return res.status(401).json({ success: false, message: 'Invalid Firebase token' });
  }
};