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
  const result = await signInWithPopup(auth, provider);

  const token = await result.user.getIdToken();

  return api.post(
    '/auth/firebase-login',
    {},
    {
      headers: {
        Authorization: "Bearer " + token
      }
    }
  );
};

/* =========================
   PHONE OTP LOGIN (FIXED)
========================= */

export const startPhoneLogin = async (phone: string) => {

  // Clear old recaptcha if exists
  if ((window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier.clear();
  }

  // Get DOM element instead of string ID
  const recaptchaContainer =
    document.getElementById('recaptcha-container') as HTMLElement;

  if (!recaptchaContainer) {
    throw new Error("reCAPTCHA container not found");
  }

  // Create verifier (Firebase v9: new RecaptchaVerifier(auth, container, options))
  (window as any).recaptchaVerifier = new RecaptchaVerifier(
    auth,
    recaptchaContainer,
    { size: 'invisible' }
  );

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

  const result = await confirmation.confirm(code);
  const token = await result.user.getIdToken();

  return api.post(
    '/auth/firebase-login',
    {},
    {
      headers: {
        Authorization: "Bearer " + token
      }
    }
  );
};
