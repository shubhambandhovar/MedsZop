# MongoDB Medicine Backup - Architecture & Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PHARMACY DASHBOARD                           │
│                      (PharmacyDashboard.tsx)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Add/Edit/Delete Medicines                               │   │
│  │ - Display medicines in list                             │   │
│  │ - Handle form inputs                                    │   │
│  │ - Show success/error messages                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    State Updates
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
    React State      localStorage          MongoDB
   (In Memory)      (Browser Storage)      (Database)
   
   Instant         Offline Access       Persistent
   Updates        (No Internet)          Backup
```

## Data Flow Diagram

### Adding a Medicine

```
┌─────────────────────────────────────────────────────────────────┐
│ User fills form and clicks "Add Medicine"                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │ Create payload │
                  │  with all data │
                  └────────┬───────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │  Update React State (Immediate)     │
         │  - Add to inventoryList array       │
         │  - Re-render component              │
         │  - Show medicine in list instantly  │
         └────────┬────────────────────────────┘
                  │
                  ▼
      ┌───────────────────────────────────────┐
      │  Save to localStorage                 │
      │  pharmacyMedicines = [...]            │
      │  (Offline backup - < 5ms)             │
      └──────────┬──────────────────────────┘
                 │
                 ▼
   ┌─────────────────────────────────────────┐
   │  POST /api/medicines/pharmacy/add        │
   │  with { pharmacyId, ...medicineData }   │
   └────────┬────────────────────────────────┘
            │
            ▼
       ┌──────────────┐
       │  Try MongoDB │
       └────┬────┬───┘
            │    │
     Success│    │Fail
            │    │
            ▼    ▼
        ┌──┐  ┌──────────────────────────┐
        │✓ │  │ Fallback to localStorage │
        │  │  │ Show: "Saving locally"   │
        └──┘  │ Will sync later          │
              └──────────────────────────┘
```

### Loading App/Medicines

```
┌──────────────────────────────────────────────────────────────┐
│ Component Mounts (PharmacyDashboard useEffect)               │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
        ┌──────────────────────────────┐
        │ Get Pharmacy ID from:         │
        │ 1. localStorage               │
        │ 2. user session               │
        │ 3. Generate if missing        │
        └────────┬─────────────────────┘
                 │
                 ▼
       ┌──────────────────────────┐
       │ Try to fetch from MongoDB:│
       │ GET /medicines/pharmacy/:id
       └────┬─────────────┬──────┘
            │             │
     Success│             │Fail
            │             │
            ▼             ▼
    ┌──────────────┐  ┌───────────────┐
    │ MongoDB has  │  │ Fall back to   │
    │ data!        │  │ localStorage   │
    └────┬─────────┘  │               │
         │            └───────┬───────┘
         ▼                    ▼
    ┌──────────────┐  ┌────────────────────┐
    │ Update state │  │ Check localStorage │
    │ Update local │  │ for 'pharmacy      │
    │ Show success │  │ Medicines'         │
    │ toast        │  └────┬───────────────┘
    └──────────────┘       │
                           ▼
                    ┌─────────────────┐
                    │ If found, use   │
                    │ If not, empty   │
                    │ state           │
                    └─────────────────┘
```

### Offline Mode

```
                Internet Down
                     │
                     ▼
         ┌────────────────────────┐
         │ User adds medicine      │
         └────┬───────────────────┘
              │
              ▼
    ┌──────────────────────────┐
    │ React State Updated       │
    │ (Instant display)        │
    └──────┬───────────────────┘
           │
           ▼
  ┌──────────────────────────┐
  │ Save to localStorage      │
  │ (✓ Success)              │
  └──────┬───────────────────┘
         │
         ▼
  ┌──────────────────────────┐
  │ Try POST to MongoDB       │
  │ Network timeout...        │
  │ (✗ Fail)                 │
  └──────┬───────────────────┘
         │
         ▼
  ┌──────────────────────────┐
  │ Catch error              │
  │ Show: "Saving locally"   │
  │ (offline mode)           │
  └──────┬───────────────────┘
         │
         ▼
  Data saved in localStorage
  Persists even if app closes
  ✓ No data loss!
  
         Internet Back
              │
              ▼
         Reload page
              │
              ▼
     Load medicines from DB
     (Already synced or
      will sync on next add)
```

## Component Interaction

```
┌─────────────────────────────────────────┐
│         PharmacyDashboard               │
├─────────────────────────────────────────┤
│ State:                                  │
│ - inventoryList: Medicine[]             │
│ - pharmacyId: string                    │
│ - isLoadingMedicines: boolean           │
│                                         │
│ Effects:                                │
│ - Load from MongoDB on mount            │
│ - Sync to localStorage on change        │
│                                         │
│ Handlers:                               │
│ - handleSaveMedicine()                  │
│ - handleOpenAddMedicine()               │
│ - handleOpenEditMedicine()              │
│ - handleCancelMedicine()                │
└────────────┬───────────────┬────────────┘
             │               │
    ┌────────▼────────┐      │
    │ medicineService │      │
    ├─────────────────┤      │
    │ Methods:        │      │
    │ - getMedicines()│      │
    │ - createPharm...│      │
    │ - updatePharm...│      │
    │ - deletePharm...│      │
    │ - getPharmacy...│      │
    └────────┬────────┘      │
             │               │
       ┌─────▼──────┐        │
       │ axios/api  │        │
       └─────┬──────┘        │
             │               │
      ┌──────▼──────┐        │
      │  Backend    │        │
      │  Express    │        │
      │  API        │        │
      └──────┬──────┘        │
             │               │
      ┌──────▼──────┐        │
      │  MongoDB    │        │
      │  Database   │        │
      └─────────────┘        │
                             │
                      ┌──────▼──────┐
                      │ localStorage│
                      │  (browser)  │
                      └─────────────┘
```

## API Request/Response Flow

### Add Medicine Request

```
REQUEST:
POST /api/medicines/pharmacy/add
Authorization: Bearer token
Content-Type: application/json

{
  "pharmacyId": "507f1f77bcf86cd799439010",
  "brand": "Crocin",
  "genericName": "Paracetamol",
  "category": "Pain Relief",
  "price": 45,
  "mrp": 50,
  "discount": 10,
  "packSize": "10 tablets",
  "manufacturer": "GSK",
  "inStock": true,
  "requiresPrescription": false,
  "description": "...",
  "imageUrl": "..."
}

RESPONSE (Success):
{
  "success": true,
  "message": "Medicine added to inventory successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "brand": "Crocin",
    "genericName": "Paracetamol",
    ...
    "pharmacyId": "507f1f77bcf86cd799439010",
    "createdAt": "2026-01-15T10:30:00Z",
    "updatedAt": "2026-01-15T10:30:00Z"
  }
}

RESPONSE (Error - Missing Field):
{
  "success": false,
  "message": "Brand name is required"
}

RESPONSE (Error - Unauthorized):
{
  "success": false,
  "message": "Not authorized to add this medicine"
}
```

## Database Schema

```
medicines collection
│
├─ _id: ObjectId (MongoDB generated)
│
├─ brand: String (Required)
│  └─ Example: "Crocin"
│
├─ genericName: String (Required)
│  └─ Example: "Paracetamol"
│
├─ price: Number (Required, min 0)
│  └─ Example: 45
│
├─ mrp: Number (Required, min 0)
│  └─ Example: 50
│
├─ discount: Number
│  └─ Example: 10
│
├─ category: String
│  └─ Example: "Pain Relief"
│
├─ description: String
│  └─ Example: "For fever and pain relief"
│
├─ inStock: Boolean (Default: true)
│
├─ requiresPrescription: Boolean (Default: false)
│
├─ manufacturer: String
│  └─ Example: "GSK"
│
├─ packSize: String
│  └─ Example: "10 tablets"
│
├─ estimatedDeliveryTime: Number (minutes)
│  └─ Example: 30
│
├─ imageUrl: String
│  └─ Example: "https://images..."
│
├─ nearbyAvailability: Boolean
│
├─ pharmacyId: ObjectId (Links to Pharmacy)
│  └─ Example: 507f1f77bcf86cd799439010
│  └─ IMPORTANT: Identifies which pharmacy owns this medicine
│
├─ createdAt: ISODate (Auto, MongoDB)
│  └─ Example: 2026-01-15T10:30:00.000Z
│
└─ updatedAt: ISODate (Auto, MongoDB)
   └─ Example: 2026-01-15T10:35:00.000Z
```

## Error Handling Flow

```
Operation (Add/Edit/Delete)
         │
         ▼
Try Block
    │
    ├─ Update React State
    │    │
    │    └─ Success ──┐
    │                 │
    ├─ Save to localStorage
    │    │
    │    └─ Success ──┐
    │                 │
    └─ Call medicineService
         │
         ├─ Success ──────────┐
         │                    │
         └─ Error:           │
            ├─ Network ──────┼──┐
            ├─ 400 Bad Data─┼──┤
            ├─ 403 Forbidden┼──┤
            └─ 500 Server ──┼──┤
                            │  │
         ┌──────────────────┘  │
         │                     │
         ▼                     ▼
    Catch Block         Success Path
         │                  │
    Final Fallback      Toast Success
    Update State Only   Show Data
         │
         ▼
    Fallback Toast
    "Saved Locally"
```

## localStorage Structure

```
Browser localStorage
│
├─ token: String
│  └─ JWT authentication token
│
├─ user: JSON String
│  └─ { id, name, email, role, pharmacyId }
│
├─ pharmacyId: String
│  └─ UUID or ID of current pharmacy
│
└─ pharmacyMedicines: JSON String (ARRAY)
   │
   └─ [
       {
         "id": "507f1f77bcf86cd799439011",
         "brand": "Crocin",
         "genericName": "Paracetamol",
         "price": 45,
         "mrp": 50,
         "discount": 10,
         "category": "Pain Relief",
         "inStock": true,
         "requiresPrescription": false,
         "manufacturer": "GSK",
         "packSize": "10 tablets",
         "estimatedDeliveryTime": 30,
         "description": "...",
         "imageUrl": "...",
         "nearbyAvailability": true
       },
       {
         ... more medicines ...
       }
     ]

Size: Typically < 1MB for 100+ medicines
Max:  ~5-10MB per browser
```

## Sync Timing Diagram

```
Add Medicine     10ms
    │            React State
    │
    ├─→ localStorage  5ms
    │                 Safe for offline
    │
    ├─→ Network Call  (Async)
    │   ├─ Timeout: 5000ms
    │   ├─ Success: 200-500ms
    │   │   └─ "Medicine added to database!"
    │   │
    │   └─ Fail: Immediate
    │       └─ "Saving locally (offline mode)"
    │
    └─ Total: 15ms-500ms from user perspective
             (UI updates instantly, DB syncs async)
```

## State Transitions

```
Initial State
    │
    ├─ localStorage.pharmacyId exists
    │   └─ Use stored ID
    │
    └─ localStorage.pharmacyId missing
       └─ Generate new ID
             │
             ▼
     Try Load from MongoDB
             │
      ┌──────┴──────┐
      │             │
    Success       Fail
      │             │
      ▼             ▼
   Set State    Use localStorage
   Show Toast   Silent fallback
             │
             └───────┬─────────┘
                     │
                     ▼
              Ready for operations
                (Add/Edit/Delete)
```

## Concurrent Operations

```
User adds Medicine A        User deletes Medicine B
          │                          │
          ├─ Update State A ─────────┼─ Update State B
          │                         │
          ├─ localStorage A ────────┼─ localStorage B
          │                         │
          └─ MongoDB A ─────────────┼─ MongoDB B
                              (Async, parallel)
                              
Result: All operations
succeed independently
No race conditions
(Each medicine has unique ID)
```

---

## Summary

- **Dual Storage:** MongoDB + localStorage
- **Offline-First:** Works without internet
- **Auto-Sync:** Async, non-blocking
- **Error Handling:** Graceful fallbacks
- **Performance:** < 500ms response time
- **Security:** Authorization checks
- **Data Integrity:** No data loss

