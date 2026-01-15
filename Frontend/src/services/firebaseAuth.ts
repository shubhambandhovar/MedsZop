import { GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from 'firebase/auth';
import api from './api';
import { auth } from '../firebase';

export const googleLogin = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const token = await result.user.getIdToken();
  return api.post('/auth/firebase-login', {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const startPhoneLogin = async (phone: string) => {
  // Create RecaptchaVerifier only once and reuse it
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible'
    });
  }
  return signInWithPhoneNumber(auth, phone, (window as any).recaptchaVerifier);
};

export const confirmPhoneOtp = async (confirmation: any, code: string) => {
  const result = await confirmation.confirm(code);
  const token = await result.user.getIdToken();
  return api.post('/auth/firebase-login', {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
