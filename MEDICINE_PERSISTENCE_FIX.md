# Medicine Data Persistence - Issue Analysis & Fix

## Problem Description
Medicine entries added by pharmacy partners were being deleted after logout or when closing/reloading the website.

## Root Causes

### 1. **State-Only Storage (No Persistence)**
- Medicines were stored **only in React state** (`inventoryList`)
- When the app reloaded or component unmounted, all state was lost
- No automatic recovery mechanism on page reload

**File:** `Frontend/src/app/components/PharmacyDashboard.tsx` (Line 42)
```tsx
// BEFORE (Lost on reload)
const [inventoryList, setInventoryList] = useState<Medicine[]>(inventory);
```

### 2. **No localStorage Initialization**
- The component didn't load medicines from `localStorage` on mount
- It only relied on the `inventory` prop from parent component
- If parent component didn't provide initial data, medicines were lost

### 3. **localStorage Cleared on Logout**
- When users logged out, the logout handler cleared **ALL** localStorage items
- This included `pharmacyMedicines` key that stored the medicines locally

**Files:**
- `Frontend/src/services/authService.ts` (Lines 82-84)
- `Frontend/src/services/api.ts` (Lines 34-42) - Also cleared on 401 errors

### 4. **Inconsistent Persistence Strategy**
- Medicines were saved to localStorage for "customer portal visibility" (Line 187)
- But there was no guarantee medicines would survive a page refresh
- No automatic sync between component state and localStorage

## Solutions Implemented

### Solution 1: Initialize State from localStorage
**File:** `Frontend/src/app/components/PharmacyDashboard.tsx`

Changed the state initialization to use a lazy initializer that:
1. First checks `localStorage` for saved medicines
2. Falls back to the `inventory` prop if nothing in localStorage
3. Recovers gracefully if localStorage data is corrupted

```tsx
// AFTER (Persists across sessions)
const [inventoryList, setInventoryList] = useState<Medicine[]>(() => {
  const saved = localStorage.getItem('pharmacyMedicines');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse pharmacyMedicines from localStorage', e);
    }
  }
  return inventory || [];
});
```

### Solution 2: Auto-Persist on Every Change
**File:** `Frontend/src/app/components/PharmacyDashboard.tsx`

Added a `useEffect` hook that automatically saves medicines to localStorage whenever the inventory list changes:

```tsx
// Persist inventory to localStorage whenever it changes
useEffect(() => {
  localStorage.setItem('pharmacyMedicines', JSON.stringify(inventoryList));
}, [inventoryList]);
```

**Benefits:**
- Every add, edit, or delete operation is immediately saved
- No manual save required
- Automatic backup in case of network failure

### Solution 3: Preserve Medicines on Logout
**File:** `Frontend/src/services/authService.ts`

Modified logout to preserve pharmacy medicines:

```tsx
logout: () => {
  // Preserve pharmacy medicines before clearing localStorage
  const pharmacyMedicines = localStorage.getItem('pharmacyMedicines');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Restore pharmacy medicines if they existed
  if (pharmacyMedicines) {
    localStorage.setItem('pharmacyMedicines', pharmacyMedicines);
  }
},
```

### Solution 4: Preserve Medicines on 401 Errors
**File:** `Frontend/src/services/api.ts`

Updated the API error handler to preserve medicines when authentication fails:

```typescript
if (error.response?.status === 401) {
  // Preserve pharmacy medicines before clearing localStorage
  const pharmacyMedicines = localStorage.getItem('pharmacyMedicines');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Restore pharmacy medicines if they existed
  if (pharmacyMedicines) {
    localStorage.setItem('pharmacyMedicines', pharmacyMedicines);
  }
  window.location.href = '/login';
}
```

## How It Works Now

### Lifecycle of Medicine Entries

1. **Adding a Medicine:**
   - User fills form and clicks "Add Medicine"
   - Medicine is added to `inventoryList` state
   - Auto-save `useEffect` triggers → saves to `localStorage`
   - API call sent to backend (if available)
   - Medicine persists even if network fails

2. **Closing/Reloading Browser:**
   - Component mounts
   - State initializer checks `localStorage` for `pharmacyMedicines`
   - If found, loads all medicines back into state
   - User sees all previously added medicines

3. **Logging Out:**
   - `authService.logout()` is called
   - Token and user data are cleared
   - But `pharmacyMedicines` in localStorage is preserved
   - Pharmacy can log back in and see all their medicines

4. **Authentication Error (401):**
   - API detects unauthorized request
   - Clears token and user
   - Preserves `pharmacyMedicines` in localStorage
   - After re-login, medicines are available

## Data Flow Diagram

```
Add/Edit/Delete Medicine
    ↓
Update React State (inventoryList)
    ↓
useEffect Detects Change
    ↓
Auto-Save to localStorage
    ↓
Send to Backend (optional)
    ↓
Medicines Persisted Locally ✅

---

Page Reload
    ↓
Component Mounts
    ↓
Initialize State from localStorage
    ↓
Medicines Restored ✅

---

Logout
    ↓
Clear Token & User
    ↓
Preserve pharmacyMedicines
    ↓
Re-login
    ↓
Medicines Still Available ✅
```

## Testing the Fix

### Test Case 1: Add Medicine → Close Browser → Reopen
1. Log in as pharmacy
2. Add a new medicine (e.g., "Test Medicine")
3. Close browser completely
4. Reopen and navigate to the site
5. **Expected:** Medicine still visible in inventory

### Test Case 2: Add Medicine → Logout → Login
1. Log in as pharmacy
2. Add a new medicine
3. Click Logout
4. Log back in
5. **Expected:** Medicine is still there

### Test Case 3: Add Multiple Medicines → Check Persistence
1. Log in as pharmacy
2. Add 3-4 different medicines
3. Edit one of them
4. Close and reopen browser
5. **Expected:** All medicines with their edited values are present

### Test Case 4: Network Failure Recovery
1. Go offline (DevTools → Network → Offline)
2. Add a medicine while offline
3. Go back online
4. Reload page
5. **Expected:** Medicine is still there (local persistence works)

## Files Modified

| File | Changes | Purpose |
|------|---------|---------|
| `Frontend/src/app/components/PharmacyDashboard.tsx` | Added lazy state initializer + auto-save useEffect | Persist medicines across sessions |
| `Frontend/src/services/authService.ts` | Preserve pharmacyMedicines on logout | Keep medicines after logout |
| `Frontend/src/services/api.ts` | Preserve pharmacyMedicines on 401 errors | Keep medicines on auth failures |

## Architecture Notes

### LocalStorage Keys Used
- `token` - JWT authentication token (cleared on logout)
- `user` - Current user data (cleared on logout)
- `pharmacyMedicines` - **NEW** Pharmacy inventory (preserved on logout/errors)

### Why localStorage and Not IndexedDB?
- **Simplicity:** localStorage is simpler and suitable for this use case
- **Size:** MedsZop inventory is unlikely to exceed 5MB
- **Performance:** localStorage is sufficient for real-time saves
- **Reliability:** Built-in browser persistence

### Future Enhancements
1. **Backend Persistence:**
   - Add `/api/pharmacy/medicines` endpoint to fetch medicines from DB
   - Make localStorage a backup, not primary storage
   - Sync on component mount: `if (localStorage.pharmacyMedicines && !backend.medicines) load from localStorage`

2. **Conflict Resolution:**
   - Handle case where backend has newer data than localStorage
   - Merge local changes with server data

3. **Encryption:**
   - Optionally encrypt sensitive medicine data in localStorage

## Success Metrics

After this fix:
- ✅ Medicines persist after browser close/reload
- ✅ Medicines persist after logout
- ✅ Medicines are auto-saved on every change
- ✅ No manual "Save" button needed
- ✅ Graceful error recovery with local backup

---

**Last Updated:** January 15, 2026
**Status:** Implemented and Tested
