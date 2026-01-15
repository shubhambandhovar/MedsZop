import { orderService } from './orderService';
import { authService } from './authService';
import { medicineService } from './medicineService';
import { subscriptionService } from './subscriptionService';
import { prescriptionService } from './prescriptionService';

/**
 * Cloud Sync Service
 * Ensures all user data is automatically backed up to MongoDB
 */

export const cloudSyncService = {
  /**
   * Sync all user data from cloud on login
   */
  syncUserDataOnLogin: async (userId: string) => {
    try {
      console.log('🔄 Syncing user data from cloud...');
      
      const syncResults = {
        orders: false,
        prescriptions: false,
        subscription: false,
        profile: false
      };

      // Sync orders
      try {
        const ordersResponse = await orderService.getMyOrders();
        if (ordersResponse.success) {
          localStorage.setItem('userOrders', JSON.stringify(ordersResponse.data));
          syncResults.orders = true;
        }
      } catch (err) {
        console.warn('Orders sync failed, using local data');
      }

      // Sync prescriptions
      try {
        const prescriptionsResponse = await prescriptionService.getMyPrescriptions();
        if (prescriptionsResponse.success) {
          localStorage.setItem('userPrescriptions', JSON.stringify(prescriptionsResponse.data));
          syncResults.prescriptions = true;
        }
      } catch (err) {
        console.warn('Prescriptions sync failed, using local data');
      }

      // Sync subscription
      try {
        const subResponse = await subscriptionService.getUserSubscription(userId);
        if (subResponse.success && subResponse.subscription) {
          localStorage.setItem('userSubscription', JSON.stringify(subResponse.subscription));
          syncResults.subscription = true;
        }
      } catch (err) {
        console.warn('Subscription sync failed, using local data');
      }

      // Sync user profile
      try {
        const profileResponse = await authService.getMe();
        if (profileResponse.success) {
          localStorage.setItem('user', JSON.stringify(profileResponse.data.user));
          syncResults.profile = true;
        }
      } catch (err) {
        console.warn('Profile sync failed, using local data');
      }

      console.log('✅ Cloud sync completed:', syncResults);
      return syncResults;
    } catch (error) {
      console.error('Cloud sync error:', error);
      return null;
    }
  },

  /**
   * Sync pharmacy medicines on login
   */
  syncPharmacyDataOnLogin: async (pharmacyId: string) => {
    try {
      console.log('🔄 Syncing pharmacy data from cloud...');
      
      const medicinesResponse = await medicineService.getPharmacyMedicines(pharmacyId);
      if (medicinesResponse.success) {
        localStorage.setItem('pharmacyMedicines', JSON.stringify(medicinesResponse.data));
        console.log('✅ Pharmacy medicines synced from cloud');
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Pharmacy data sync failed, using local data');
      return false;
    }
  },

  /**
   * Auto-save order to cloud after checkout
   */
  saveOrderToCloud: async (orderData: any) => {
    try {
      const response = await orderService.createOrder(orderData);
      if (response.success) {
        // Update local cache
        const localOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
        localOrders.unshift(response.data);
        localStorage.setItem('userOrders', JSON.stringify(localOrders));
        console.log('✅ Order saved to cloud');
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to save order to cloud:', error);
      // Save locally as fallback
      const localOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
      localOrders.unshift(orderData);
      localStorage.setItem('userOrders', JSON.stringify(localOrders));
      throw error;
    }
  },

  /**
   * Save prescription to cloud
   */
  savePrescriptionToCloud: async (prescriptionData: {
    imageUrl: string;
    medicines?: string[];
    doctorName?: string;
    validUntil?: string;
  }) => {
    try {
      const response = await prescriptionService.savePrescription(prescriptionData);
      if (response.success) {
        // Update local cache
        const localPrescriptions = JSON.parse(localStorage.getItem('userPrescriptions') || '[]');
        localPrescriptions.unshift(response.data);
        localStorage.setItem('userPrescriptions', JSON.stringify(localPrescriptions));
        console.log('✅ Prescription saved to cloud');
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to save prescription to cloud:', error);
      throw error;
    }
  },

  /**
   * Update user profile in cloud
   */
  updateProfileInCloud: async (profileData: any) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success) {
        // Update local cache
        localStorage.setItem('user', JSON.stringify(response.data.user));
        console.log('✅ Profile updated in cloud');
        return response.data.user;
      }
      return null;
    } catch (error) {
      console.error('Failed to update profile in cloud:', error);
      throw error;
    }
  },

  /**
   * Save cart items to cloud (for logged-in users)
   */
  saveCartToCloud: async (userId: string, cartItems: any[]) => {
    try {
      // Store cart in localStorage with user ID
      const cartKey = `cart_${userId}`;
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
      
      // TODO: Add backend endpoint for cart persistence
      console.log('✅ Cart saved locally for user:', userId);
      return true;
    } catch (error) {
      console.error('Failed to save cart:', error);
      return false;
    }
  },

  /**
   * Load cart from cloud
   */
  loadCartFromCloud: async (userId: string) => {
    try {
      const cartKey = `cart_${userId}`;
      const savedCart = localStorage.getItem(cartKey);
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Failed to load cart:', error);
      return [];
    }
  },

  /**
   * Clear all local caches (use after logout)
   */
  clearLocalCache: () => {
    const keysToPreserve = ['pharmacyMedicines', 'medszop_admins'];
    const allKeys = Object.keys(localStorage);
    
    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('🧹 Local cache cleared (preserved pharmacy data)');
  },

  /**
   * Background sync for offline changes
   */
  syncOfflineChanges: async () => {
    try {
      console.log('🔄 Syncing offline changes...');
      
      // Check for pending orders
      const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
      if (pendingOrders.length > 0) {
        for (const order of pendingOrders) {
          try {
            await orderService.createOrder(order);
            console.log('✅ Synced offline order:', order.id);
          } catch (err) {
            console.warn('Failed to sync order:', order.id);
          }
        }
        localStorage.removeItem('pendingOrders');
      }

      console.log('✅ Offline sync completed');
      return true;
    } catch (error) {
      console.error('Offline sync error:', error);
      return false;
    }
  }
};

export default cloudSyncService;
