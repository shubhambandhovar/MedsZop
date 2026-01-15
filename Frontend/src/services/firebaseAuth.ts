import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup
} from 'firebase/auth';

import api from './api';
import { auth } from '../firebase';

/* =========================
   GOOGLE LOGIN
========================= */

export const googleLogin = async () => {
  const provider = new GoogleAuthProvider();

  // Open Google popup
  const result = await signInWithPopup(auth, provider);

  // Get Firebase ID token
  const token = await result.user.getIdToken();

  // Send token to backend
  return api.post('/auth/firebase-login', {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};

/* =========================
   PHONE OTP LOGIN
========================= */

export const startPhoneLogin = async (phone: string) => {

  // Create reCAPTCHA only once
  if (!(window as any).recaptchaVerifier) {

    (window as any).recaptchaVerifier = new RecaptchaVerifier(
      auth,
      'recaptcha-container',
      {
        size: 'invisible'
      }
    );
  }

  // Send OTP
  return signInWithPhoneNumber(
    auth,
    phone,
    (window as any).recaptchaVerifier
  );
};

/* =========================
   CONFIRM OTP
========================= */

export const confirmPhoneOtp = async (confirmation: any, code: string) => {

  // Verify OTP
  const result = await confirmation.confirm(code);

  // Get Firebase token
  const token = await result.user.getIdToken();

  // Send token to backend
  return api.post('/auth/firebase-login', {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
};
