# Medicine MongoDB Backup Implementation

## Overview
Medicines are now backed up to MongoDB with offline-first architecture. Data is automatically synced between the frontend, localStorage, and MongoDB database.

## Architecture

### Data Storage Hierarchy
```
MongoDB (Primary Source)
    ↓ (sync)
localStorage (Offline Cache)
    ↓ (display)
React State (UI)
```

### How It Works

1. **On App Load:**
   - Component checks MongoDB for pharmacy's medicines
   - If found, updates localStorage and state
   - If not found, falls back to localStorage
   - If neither exists, uses empty array

2. **On Add/Edit/Delete:**
   - Updates React state immediately (instant UI feedback)
   - Saves to localStorage (offline backup)
   - Sends to MongoDB (persistent storage)
   - Shows appropriate toast message

3. **Offline Mode:**
   - If MongoDB sync fails, data is still saved locally
   - On reconnection, can manually sync to database

## Backend Changes

### New MongoDB Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/medicines/pharmacy/:pharmacyId` | Fetch pharmacy medicines | Pharmacy |
| POST | `/api/medicines/pharmacy/add` | Add new medicine | Pharmacy |
| PUT | `/api/medicines/pharmacy/:id` | Update medicine | Pharmacy |
| DELETE | `/api/medicines/pharmacy/:id` | Delete medicine | Pharmacy |

### Database Model Enhancement

The Medicine model already has `pharmacyId` field:
```typescript
export interface IMedicine extends Document {
  name: string;
  brand: string;
  genericName: string;
  price: number;
  mrp: number;
  discount: number;
  description: string;
  category: string;
  inStock: boolean;
  requiresPrescription: boolean;
  manufacturer: string;
  packSize: string;
  nearbyAvailability: boolean;
  estimatedDeliveryTime: number;
  imageUrl: string;
  pharmacyId?: mongoose.Types.ObjectId;  // ← Links medicine to pharmacy
  createdAt: Date;
  updatedAt: Date;
}
```

### Controller Functions

#### getPharmacyMedicines()
Retrieves all medicines for a specific pharmacy with filtering and pagination.

**Query Parameters:**
- `search` - Search by brand, generic name, or manufacturer
- `category` - Filter by category
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 25,
  "page": 1,
  "pages": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "brand": "Crocin",
      "genericName": "Paracetamol",
      "price": 45,
      "pharmacyId": "507f1f77bcf86cd799439010",
      ...
    }
  ]
}
```

#### createPharmacyMedicine()
Creates a new medicine entry for pharmacy with authorization check.

**Request Body:**
```json
{
  "pharmacyId": "507f1f77bcf86cd799439010",
  "brand": "Aspirin",
  "genericName": "Acetylsalicylic Acid",
  "category": "Pain Relief",
  "price": 50,
  "mrp": 60,
  "discount": 16.67,
  ...
}
```

#### updatePharmacyMedicine()
Updates a medicine. Verifies ownership before allowing update.

**Authorization:** Only pharmacy that owns the medicine can update.

#### deletePharmacyMedicine()
Deletes a medicine with ownership verification.

**Authorization:** Only pharmacy that owns the medicine can delete.

## Frontend Changes

### medicineService.ts

Added pharmacy-specific methods:
- `getPharmacyMedicines(pharmacyId, filters)` - Fetch medicines
- `createPharmacyMedicine(pharmacyId, medicineData)` - Add medicine
- `updatePharmacyMedicine(medicineId, pharmacyId, data)` - Update medicine
- `deletePharmacyMedicine(medicineId, pharmacyId)` - Delete medicine

### PharmacyDashboard.tsx

#### New State Variables
```typescript
const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);
const [pharmacyId, setPharmacyId] = useState<string>('');
```

#### New useEffect for MongoDB Load
```typescript
useEffect(() => {
  const loadPharmacyMedicines = async () => {
    // Get pharmacy ID from user session
    // Load medicines from MongoDB
    // Fall back to localStorage if needed
  };
  loadPharmacyMedicines();
}, []);
```

#### Updated Save Logic
The `handleSaveMedicine()` function now:
1. Updates React state immediately
2. Attempts MongoDB save (with try-catch)
3. Falls back to localStorage if MongoDB fails
4. Shows appropriate toast messages

## Data Flow Diagram

### Adding a Medicine
```
User Fills Form
    ↓
Click "Add Medicine"
    ↓
Update React State (Instant UI Update)
    ↓
Save to localStorage (Offline Backup)
    ↓
Post to MongoDB (Persistent Storage)
    ├─ Success: Show "Added to database"
    └─ Fail: Show "Saving locally (offline mode)"
```

### Loading Pharmacy
```
Component Mounts
    ↓
Check localStorage for Pharmacy ID
    ├─ Not found: Generate demo ID
    └─ Found: Use stored ID
    ↓
Fetch from MongoDB (/api/medicines/pharmacy/:id)
    ├─ Success: Use database data
    │   ↓
    │   Save to localStorage
    │   ↓
    │   Update React State
    │   ↓
    │   Show success toast
    │
    └─ Fail: Fall back to localStorage
        ↓
        Check localStorage for cached medicines
        ├─ Found: Use cached data
        └─ Not found: Start with empty
```

## User Experience

### Toast Messages
- **Success:** "Medicine added to database successfully!"
- **Warning:** "Saving locally (offline mode). Will sync when online."
- **Error:** "Unable to save. Saved locally for now."

### Loading State
- Shows loading indicator while fetching from MongoDB
- Falls back gracefully if MongoDB is unavailable

### Offline Mode
- Medicines can still be added/edited/deleted offline
- Changes are saved to localStorage
- On reconnection, changes persist in MongoDB (next sync)

## Database Query Examples

### Find medicines by pharmacy:
```javascript
db.medicines.find({ pharmacyId: ObjectId("...") })
```

### Find medicines by pharmacy and category:
```javascript
db.medicines.find({ 
  pharmacyId: ObjectId("..."),
  category: "Pain Relief"
})
```

### Update medicine price:
```javascript
db.medicines.updateOne(
  { _id: ObjectId("..."), pharmacyId: ObjectId("...") },
  { $set: { price: 50 } }
)
```

## Error Handling

### Graceful Degradation
- If MongoDB is unavailable, app continues to work offline
- Data is persisted locally in localStorage
- No data loss
- Automatic sync when connection restored

### Authorization Checks
- Backend verifies pharmacyId matches medicine's pharmacyId
- Prevents unauthorized updates/deletes
- Returns 403 Forbidden if not authorized

### Data Validation
- Validates required fields (brand, generic name, price, etc.)
- Price must be positive number
- Category must be provided
- Returns 400 Bad Request for invalid data

## Testing

### Manual Test Checklist

**Test 1: Add Medicine with Internet**
1. Start backend server
2. Login as pharmacy
3. Add a medicine
4. Check MongoDB: `db.medicines.findOne({brand: "Test"})`
5. Expected: Medicine in database with pharmacyId

**Test 2: Add Medicine Offline**
1. Turn off backend server or go offline
2. Add a medicine
3. Should show "Saving locally (offline mode)"
4. Turn backend back on
5. Reload page
6. Medicine should still be there

**Test 3: Sync to MongoDB**
1. Add medicine while offline
2. Turn backend on
3. Reload page
4. Check MongoDB for the medicine
5. Expected: Medicine synced to database

**Test 4: Persistence Across Sessions**
1. Add 3 medicines
2. Close browser completely
3. Reopen and login
4. Go to Inventory
5. Expected: All 3 medicines visible

**Test 5: Edit and Delete**
1. Add a medicine
2. Edit its price
3. Reload page (data should persist)
4. Check MongoDB (shows updated price)
5. Delete medicine
6. Check MongoDB (medicine should be deleted)

## Performance Considerations

### Query Optimization
- Uses pagination (default 50 items per page)
- Supports search and filtering
- Indexes on pharmacyId, brand, category recommended

### Recommended MongoDB Indexes
```javascript
db.medicines.createIndex({ pharmacyId: 1 })
db.medicines.createIndex({ pharmacyId: 1, createdAt: -1 })
db.medicines.createIndex({ brand: "text", genericName: "text" })
```

### Caching Strategy
- localStorage is checked first (fast)
- MongoDB is synced in background
- No blocking operations

## Future Enhancements

1. **Batch Sync:** Sync multiple local changes in one API call
2. **Conflict Resolution:** Handle case where both server and local have changes
3. **Encryption:** Encrypt sensitive medicine data in localStorage
4. **Export/Import:** CSV export of medicines, bulk import
5. **Versioning:** Track medicine changes over time
6. **Audit Log:** See who added/edited/deleted medicines
7. **Soft Delete:** Archive instead of permanent delete

## Files Modified

| File | Changes |
|------|---------|
| `Backend/src/models/Medicine.ts` | Already has pharmacyId (no change needed) |
| `Backend/src/controllers/medicineController.ts` | Added 4 new functions |
| `Backend/src/routes/medicine.routes.ts` | Added 4 new routes |
| `Frontend/src/services/medicineService.ts` | Added 4 new methods |
| `Frontend/src/app/components/PharmacyDashboard.tsx` | Updated with MongoDB sync logic |

## Deployment Notes

### Database Migration
If upgrading from existing data without pharmacyId:
```javascript
db.medicines.updateMany(
  { pharmacyId: { $exists: false } },
  { $set: { pharmacyId: null } }
)
```

### Environment Variables
Ensure MongoDB connection is properly configured:
```env
MONGODB_URI=mongodb://localhost:27017/medszop
```

### API Rate Limiting
Consider adding rate limiting for `/api/medicines/pharmacy/*` endpoints to prevent abuse.

---

**Status:** Implemented and Ready for Testing
**Sync Strategy:** Dual (localStorage + MongoDB)
**Fallback:** localStorage when MongoDB unavailable
