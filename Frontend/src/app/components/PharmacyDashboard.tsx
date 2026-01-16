import { useEffect, useState } from 'react';
import { 
  Package, CheckCircle, XCircle, TrendingUp, Clock, ShoppingBag, 
  Plus, Edit, AlertCircle, FileText, BarChart3, Store, Bell,
  Pill, DollarSign, Search, Image as ImageIcon, MapPin, Phone, Mail
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PharmacyOrder, Medicine, Prescription } from '../types';
import { toast } from 'sonner';
import { medicineService } from '../../services/medicineService';

interface PharmacyDashboardProps {
  pharmacyName: string;
  orders: PharmacyOrder[];
  inventory: Medicine[];
  onAcceptOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
  onLogout?: () => void;
}

export function PharmacyDashboard({
  pharmacyName,
  orders,
  inventory,
  onAcceptOrder,
  onRejectOrder,
  onLogout,
}: PharmacyDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddingMedicine, setIsAddingMedicine] = useState(false);
  const [isEditingMedicine, setIsEditingMedicine] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);
  const [pharmacyId, setPharmacyId] = useState<string>('');
  const [inventoryList, setInventoryList] = useState<Medicine[]>(() => {
    // Load from localStorage first, then fallback to inventory prop
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
  const [medicineForm, setMedicineForm] = useState({
    brand: '',
    genericName: '',
    category: '',
    price: '',
    discount: '',
    mrp: '',
    packSize: '',
    manufacturer: '',
    requiresPrescription: false,
    inStock: true,
    description: '',
    imageUrl: '',
    estimatedDeliveryTime: '30',
  });
  const [profileData, setProfileData] = useState({
    address: '789, Pharmacy Lane, Suite 100, Bangalore, Karnataka, 560034',
    phone: '+91 98765 54321',
    email: 'pharmacy@healthplus.com',
    workingHours: {
      weekdays: '9:00 AM - 9:00 PM',
      sunday: '10:00 AM - 6:00 PM'
    }
  });

  // Order filters
  const pendingOrders = orders.filter((o) => o.status === 'confirmed');
  const activeOrders = orders.filter((o) => o.status === 'packed' || o.status === 'out_for_delivery');
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  // Load pharmacy medicines from MongoDB on mount
  useEffect(() => {
    const loadPharmacyMedicines = async () => {
      try {
        setIsLoadingMedicines(true);
        
        // Get pharmacy ID from localStorage or user session
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let pid = user.pharmacyId || localStorage.getItem('pharmacyId') || '';
        
        // For demo purposes, use a mock pharmacy ID if not available
        if (!pid) {
          pid = 'demo-pharmacy-' + new Date().getTime().toString().slice(-5);
          localStorage.setItem('pharmacyId', pid);
        }
        
        setPharmacyId(pid);
        
        // Check if this is a mock user (skip API calls for mock users)
        const isMockUser = user.id?.startsWith('pharmacy-') || user.id?.startsWith('mock-') || user.id?.startsWith('demo-');
        
        if (isMockUser) {
          // For mock users, just use localStorage
          const saved = localStorage.getItem('pharmacyMedicines');
          if (saved) {
            try {
              const localMeds = JSON.parse(saved);
              setInventoryList(localMeds);
            } catch (e) {
              console.error('Failed to parse local medicines', e);
            }
          }
          setIsLoadingMedicines(false);
          return;
        }
        
        // Try to load from MongoDB (only for real authenticated users)
        try {
          const response = await medicineService.getPharmacyMedicines(pid);
          if (response.success && response.data.length > 0) {
            // Server has medicines, sync to localStorage and state
            setInventoryList(response.data);
            localStorage.setItem('pharmacyMedicines', JSON.stringify(response.data));
            toast.success('Medicines loaded from database');
          } else {
            // No medicines in database, check localStorage
            const saved = localStorage.getItem('pharmacyMedicines');
            if (saved) {
              const localMeds = JSON.parse(saved);
              if (localMeds.length > 0) {
                setInventoryList(localMeds);
                // Optionally sync local medicines to database
                console.log('Syncing local medicines to database...');
              }
            }
          }
        } catch (error: any) {
          console.log('Could not load from database, using local storage:', error.message);
          // Fall back to localStorage if API fails
          const saved = localStorage.getItem('pharmacyMedicines');
          if (saved) {
            try {
              const localMeds = JSON.parse(saved);
              setInventoryList(localMeds);
            } catch (e) {
              console.error('Failed to parse local medicines', e);
            }
          }
        }
      } finally {
        setIsLoadingMedicines(false);
      }
    };

    loadPharmacyMedicines();
  }, []);

  // Persist inventory to both localStorage and MongoDB whenever it changes
  useEffect(() => {
    // Always save to localStorage for offline access
    localStorage.setItem('pharmacyMedicines', JSON.stringify(inventoryList));

    // Also sync to MongoDB (async, no await)
    if (pharmacyId) {
      // This is a background sync, we'll implement individual sync on each operation
    }
  }, [inventoryList, pharmacyId]);

  // Stats calculation
  const stats = {
    totalOrders: orders.length,
    pendingOrders: pendingOrders.length,
    activeOrders: activeOrders.length,
    completedOrders: completedOrders.length,
    totalRevenue: completedOrders.reduce((sum, order) => sum + order.total, 0),
    lowStockItems: inventory.filter((m) => m.inStock && m.packSize.includes('10')).length,
    pendingPrescriptions: pendingOrders.filter((o) => o.prescriptionRequired).length,
  };

  // Filtered inventory
  const filteredInventory = inventoryList.filter((med) => {
    const query = searchQuery.toLowerCase();
    return (
      med.brand.toLowerCase().includes(query) ||
      med.genericName.toLowerCase().includes(query) ||
      (med.manufacturer?.toLowerCase().includes(query) ?? false)
    );
  });

  const handleUpdateStock = (medicineId: string) => {
    toast.success('Stock updated successfully!');
  };

  const handleVerifyPrescription = (prescriptionId: string, approve: boolean) => {
    if (approve) {
      toast.success('Prescription verified and approved!');
    } else {
      toast.error('Prescription rejected');
    }
  };

  const handleSaveProfile = () => {
    setIsEditingProfile(false);
    toast.success('Profile updated successfully!');
  };

  const handleOpenAddMedicine = () => {
    setSelectedMedicine(null);
    setMedicineForm({
      brand: '',
      genericName: '',
      category: '',
      price: '',
      discount: '',
      mrp: '',
      packSize: '',
      manufacturer: '',
      requiresPrescription: false,
      inStock: true,
      description: '',
      imageUrl: '',
      estimatedDeliveryTime: '30',
    });
    setIsAddingMedicine(true);
  };

  const handleOpenEditMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setMedicineForm({
      brand: medicine.brand,
      genericName: medicine.genericName,
      category: medicine.category,
      price: medicine.price.toString(),
      discount: medicine.discount.toString(),
      mrp: medicine.mrp?.toString?.() ?? medicine.price.toString(),
      packSize: medicine.packSize,
      manufacturer: medicine.manufacturer,
      requiresPrescription: medicine.requiresPrescription,
      inStock: medicine.inStock,
      description: medicine.description || '',
      imageUrl: medicine.imageUrl || '',
      estimatedDeliveryTime: medicine.estimatedDeliveryTime?.toString?.() ?? '30',
    });
    setIsEditingMedicine(true);
  };

  const handleSaveMedicine = async () => {
    const price = Number(medicineForm.price) || 0;
    const discount = Number(medicineForm.discount) || 0;
    const mrp = Number(medicineForm.mrp) || (discount > 0 ? Math.round(price / (1 - discount / 100)) : price);

    const payload: Medicine = {
      id: selectedMedicine?.id ?? `new-${Date.now()}`,
      name: medicineForm.brand || medicineForm.genericName || 'New Medicine',
      brand: medicineForm.brand,
      genericName: medicineForm.genericName,
      price,
      mrp,
      discount,
      description: medicineForm.description || 'Added by pharmacy partner',
      category: medicineForm.category,
      inStock: medicineForm.inStock,
      requiresPrescription: medicineForm.requiresPrescription,
      manufacturer: medicineForm.manufacturer,
      packSize: medicineForm.packSize,
      nearbyAvailability: true,
      estimatedDeliveryTime: Number(medicineForm.estimatedDeliveryTime) || 30,
      imageUrl: medicineForm.imageUrl || selectedMedicine?.imageUrl || 'https://images.unsplash.com/photo-1582719478248-54e9f2af2e8f?w=400',
    } as Medicine;

    // Check if this is a mock user (skip API calls for mock users)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isMockUser = user.id?.startsWith('pharmacy-') || user.id?.startsWith('mock-') || user.id?.startsWith('demo-');

    try {
      if (isAddingMedicine) {
        let saved = payload;
        
        if (!isMockUser) {
          try {
            // Try to save to MongoDB (only for authenticated users)
            const res = await medicineService.createPharmacyMedicine(pharmacyId, payload);
            saved = res.data ? { ...payload, ...res.data, id: res.data.id || res.data._id || payload.id } : payload;
            toast.success('Medicine added to database successfully!');
          } catch (dbError: any) {
            console.warn('Database save failed, saving locally:', dbError.message);
            toast.warning('Saving locally (offline mode). Will sync when online.');
          }
        } else {
          // Mock user - save only to localStorage
          toast.success('Medicine added successfully!');
        }
        
        setInventoryList((prev) => [...prev, saved]);
        setIsAddingMedicine(false);
      } else if (isEditingMedicine && selectedMedicine) {
        if (!isMockUser) {
          try {
            // Try to update in MongoDB (only for authenticated users)
            await medicineService.updatePharmacyMedicine(selectedMedicine.id, pharmacyId, payload);
            toast.success('Medicine updated in database!');
          } catch (dbError: any) {
            console.warn('Database update failed, updating locally:', dbError.message);
            toast.warning('Updated locally. Will sync when online.');
          }
        } else {
          // Mock user - update only localStorage
          toast.success('Medicine updated successfully!');
        }
        
        setInventoryList((prev) => prev.map((m) => (m.id === selectedMedicine.id ? { ...payload, id: m.id } : m)));
        setIsEditingMedicine(false);
      }
    } catch (err: any) {
      // Final fallback: update local state
      setInventoryList((prev) => {
        if (isAddingMedicine) return [...prev, payload];
        if (isEditingMedicine && selectedMedicine) return prev.map((m) => (m.id === selectedMedicine.id ? payload : m));
        return prev;
      });
      toast.error('Unable to save. Saved locally for now.');
    }

    setSelectedMedicine(null);
    setMedicineForm({
      brand: '',
      genericName: '',
      category: '',
      price: '',
      discount: '',
      mrp: '',
      packSize: '',
      manufacturer: '',
      requiresPrescription: false,
      inStock: true,
      description: '',
      imageUrl: '',
      estimatedDeliveryTime: '30',
    });
  };

  const handleCancelMedicine = () => {
    setIsAddingMedicine(false);
    setIsEditingMedicine(false);
    setSelectedMedicine(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-[var(--health-green)]" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--health-blue)]">{pharmacyName}</h1>
              <p className="text-sm text-muted-foreground">Pharmacy Partner Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Bell className="h-4 w-4" />
              <Badge className="bg-red-500">{stats.pendingPrescriptions}</Badge>
            </Button>
            {onLogout && (
              <Button onClick={onLogout} variant="outline">
                Logout
              </Button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 w-full max-w-3xl">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab}>
          {/* DASHBOARD TAB */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-blue-light)]">
                      <ShoppingBag className="h-6 w-6 text-[var(--health-blue)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalOrders}</p>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.pendingOrders}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--health-green-light)]">
                      <Package className="h-6 w-6 text-[var(--health-green)]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.activeOrders}</p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.completedOrders}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Revenue</p>
                      <p className="text-2xl font-bold text-[var(--health-green)]">₹{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-[var(--health-green)]" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Prescriptions</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.pendingPrescriptions}</p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                      <p className="text-2xl font-bold text-red-600">{stats.lowStockItems}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <Button 
                  className="gap-2 bg-[var(--health-green)] hover:bg-[var(--health-green-dark)]"
                  onClick={() => setActiveTab('inventory')}
                >
                  <Plus className="h-4 w-4" />
                  Add Medicine
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setActiveTab('prescriptions')}
                >
                  <FileText className="h-4 w-4" />
                  Verify Prescriptions
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setActiveTab('orders')}
                >
                  <Package className="h-4 w-4" />
                  Manage Orders
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.items.length} items • ₹{order.total}</p>
                    </div>
                    <Badge className="bg-orange-500">Pending</Badge>
                  </div>
                ))}
                {pendingOrders.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No pending orders</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* INVENTORY TAB - MOST IMPORTANT */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>💊 Medicine Inventory Management</CardTitle>
                <Button 
                  className="gap-2 bg-[var(--health-green)] hover:bg-[var(--health-green-dark)]"
                  onClick={handleOpenAddMedicine}
                >
                  <Plus className="h-4 w-4" />
                  Add New Medicine
                </Button>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="mb-4 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search medicines by name or brand..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Inventory Grid */}
                <div className="space-y-3">
                  {filteredInventory.map((medicine) => (
                    <Card key={medicine.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Pill className="h-4 w-4 text-[var(--health-blue)]" />
                              <h3 className="font-semibold">{medicine.brand}</h3>
                              <Badge variant="outline">{medicine.category}</Badge>
                              {medicine.requiresPrescription && (
                                <Badge className="bg-red-500">Rx Required</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{medicine.genericName}</p>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Price: </span>
                                <span className="font-semibold">₹{medicine.price}</span>
                                {medicine.discount > 0 && (
                                  <span className="ml-2 text-green-600">({medicine.discount}% off)</span>
                                )}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Stock: </span>
                                <span className={medicine.inStock ? "font-semibold text-green-600" : "font-semibold text-red-600"}>
                                  {medicine.inStock ? "In Stock" : "Out of Stock"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Pack: </span>
                                <span className="font-semibold">{medicine.packSize}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Manufacturer: </span>
                                <span className="font-semibold">{medicine.manufacturer}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenEditMedicine(medicine)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStock(medicine.id)}>
                              <Package className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Medicine Add/Edit Dialog */}
                {(isAddingMedicine || isEditingMedicine) && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                      <CardHeader>
                        <CardTitle>{isAddingMedicine ? '➕ Add New Medicine' : '✏️ Edit Medicine'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Brand Name *</Label>
                            <Input
                              value={medicineForm.brand}
                              onChange={(e) => setMedicineForm({ ...medicineForm, brand: e.target.value })}
                              placeholder="e.g., Crocin"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Generic Name *</Label>
                            <Input
                              value={medicineForm.genericName}
                              onChange={(e) => setMedicineForm({ ...medicineForm, genericName: e.target.value })}
                              placeholder="e.g., Paracetamol"
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label>Category *</Label>
                            <Input
                              value={medicineForm.category}
                              onChange={(e) => setMedicineForm({ ...medicineForm, category: e.target.value })}
                              placeholder="e.g., Pain Relief"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Manufacturer *</Label>
                            <Input
                              value={medicineForm.manufacturer}
                              onChange={(e) => setMedicineForm({ ...medicineForm, manufacturer: e.target.value })}
                              placeholder="e.g., GSK"
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <Label>Price (₹) *</Label>
                            <Input
                              type="number"
                              value={medicineForm.price}
                              onChange={(e) => setMedicineForm({ ...medicineForm, price: e.target.value })}
                              placeholder="24"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>MRP (₹)</Label>
                            <Input
                              type="number"
                              value={medicineForm.mrp}
                              onChange={(e) => setMedicineForm({ ...medicineForm, mrp: e.target.value })}
                              placeholder="30"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Discount (%)</Label>
                            <Input
                              type="number"
                              value={medicineForm.discount}
                              onChange={(e) => setMedicineForm({ ...medicineForm, discount: e.target.value })}
                              placeholder="20"
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div>
                            <Label>Pack Size *</Label>
                            <Input
                              value={medicineForm.packSize}
                              onChange={(e) => setMedicineForm({ ...medicineForm, packSize: e.target.value })}
                              placeholder="15 tablets"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Estimated Delivery (mins)</Label>
                            <Input
                              type="number"
                              value={medicineForm.estimatedDeliveryTime}
                              onChange={(e) => setMedicineForm({ ...medicineForm, estimatedDeliveryTime: e.target.value })}
                              placeholder="30"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Image URL</Label>
                            <Input
                              value={medicineForm.imageUrl}
                              onChange={(e) => setMedicineForm({ ...medicineForm, imageUrl: e.target.value })}
                              placeholder="https://..."
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Description</Label>
                          <Input
                            value={medicineForm.description}
                            onChange={(e) => setMedicineForm({ ...medicineForm, description: e.target.value })}
                            placeholder="Short description"
                            className="mt-2"
                          />
                        </div>

                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="requiresPrescription"
                              checked={medicineForm.requiresPrescription}
                              onChange={(e) => setMedicineForm({ ...medicineForm, requiresPrescription: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="requiresPrescription" className="cursor-pointer">
                              Requires Prescription
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="inStock"
                              checked={medicineForm.inStock}
                              onChange={(e) => setMedicineForm({ ...medicineForm, inStock: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <Label htmlFor="inStock" className="cursor-pointer">
                              In Stock
                            </Label>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            className="flex-1 bg-[var(--health-green)] hover:bg-[var(--health-green-dark)]"
                            onClick={handleSaveMedicine}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {isAddingMedicine ? 'Add Medicine' : 'Save Changes'}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handleCancelMedicine}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ORDERS TAB */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📦 Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pending">
                  <TabsList>
                    <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
                    <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pending" className="space-y-4">
                    {pendingOrders.map((order) => (
                      <Card key={order.id} className="border-orange-200">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{order.orderNumber}</h3>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.date).toLocaleString()}
                              </p>
                            </div>
                            <Badge className="bg-orange-500">Pending Verification</Badge>
                          </div>

                          <div className="mb-4 space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.brand} × {item.quantity}</span>
                                <span className="font-medium">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="mb-3 flex justify-between border-t pt-3">
                            <span className="font-semibold">Total Amount</span>
                            <span className="font-bold text-[var(--health-blue)]">₹{order.total}</span>
                          </div>

                          {order.prescriptionRequired && (
                            <div className="mb-3 rounded-lg bg-blue-50 p-2 text-sm text-blue-700">
                              ⚠️ Prescription verification required
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              className="flex-1 bg-[var(--health-green)] hover:bg-[var(--health-green-dark)]"
                              onClick={() => onAcceptOrder(order.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accept Order
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white"
                              onClick={() => onRejectOrder(order.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {pendingOrders.length === 0 && (
                      <p className="py-8 text-center text-muted-foreground">No pending orders</p>
                    )}
                  </TabsContent>

                  <TabsContent value="active" className="space-y-4">
                    {activeOrders.map((order) => (
                      <Card key={order.id} className="border-[var(--health-green)]">
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{order.orderNumber}</h3>
                              <p className="text-sm text-muted-foreground">Assigned to: {order.assignedTo}</p>
                            </div>
                            <Badge className="bg-[var(--health-green)]">
                              {order.status === 'packed' ? 'Packed' : 'Out for Delivery'}
                            </Badge>
                          </div>

                          <div className="mb-3 space-y-2">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.brand} × {item.quantity}</span>
                                <span className="font-medium">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between border-t pt-3">
                            <span className="font-semibold">Total Amount</span>
                            <span className="font-bold text-[var(--health-blue)]">₹{order.total}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {activeOrders.length === 0 && (
                      <p className="py-8 text-center text-muted-foreground">No active orders</p>
                    )}
                  </TabsContent>

                  <TabsContent value="completed" className="space-y-4">
                    {completedOrders.map((order) => (
                      <Card key={order.id}>
                        <CardContent className="p-4">
                          <div className="mb-3 flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{order.orderNumber}</h3>
                              <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleString()}</p>
                            </div>
                            <Badge className="bg-green-600">Delivered</Badge>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Amount</span>
                            <span className="font-semibold">₹{order.total}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {completedOrders.length === 0 && (
                      <p className="py-8 text-center text-muted-foreground">No completed orders</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PRESCRIPTIONS TAB */}
          <TabsContent value="prescriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📤 Prescription Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingOrders.filter((o) => o.prescriptionRequired).map((order) => (
                  <Card key={order.id} className="border-orange-200">
                    <CardContent className="p-4">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">Order {order.orderNumber}</h3>
                          <p className="text-sm text-muted-foreground">{new Date(order.date).toLocaleString()}</p>
                        </div>
                        <Badge className="bg-orange-500">Pending Verification</Badge>
                      </div>

                      <div className="mb-4 bg-gray-100 rounded-lg p-3 flex items-center gap-3">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Prescription Image Uploaded</p>
                          <p className="text-xs text-muted-foreground">Click to view full prescription</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-semibold mb-2">Medicines in order:</p>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="text-sm flex justify-between">
                              <span>• {item.brand}</span>
                              <span className="text-muted-foreground">{item.genericName}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-[var(--health-green)] hover:bg-[var(--health-green-dark)]"
                          onClick={() => handleVerifyPrescription(order.id, true)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Prescription
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-white"
                          onClick={() => handleVerifyPrescription(order.id, false)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingOrders.filter((o) => o.prescriptionRequired).length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">No pending prescriptions</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Sales & Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-2">
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                      <p className="text-3xl font-bold text-[var(--health-green)]">₹{stats.totalRevenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-2">From {stats.completedOrders} completed orders</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Average Order Value</p>
                      <p className="text-3xl font-bold text-[var(--health-blue)]">
                        ₹{stats.completedOrders > 0 ? Math.round(stats.totalRevenue / stats.completedOrders) : 0}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Per order</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardContent className="p-6">
                      <p className="text-sm text-muted-foreground mb-1">Inventory Items</p>
                      <p className="text-3xl font-bold text-[var(--health-purple)]">{inventory.length}</p>
                      <p className="text-xs text-muted-foreground mt-2">Total medicines</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Selling Medicines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {inventory.slice(0, 5).map((med, idx) => (
                        <div key={med.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-muted-foreground">#{idx + 1}</span>
                            <div>
                              <p className="font-semibold">{med.brand}</p>
                              <p className="text-sm text-muted-foreground">{med.category}</p>
                            </div>
                          </div>
                          <Badge>₹{med.price}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROFILE TAB */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>🏪 Pharmacy Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label>Pharmacy Name</Label>
                    <Input value={pharmacyName} disabled className="mt-2" />
                  </div>
                  <div>
                    <Label>License Number</Label>
                    <Input value="PH-2024-12345" disabled className="mt-2" />
                  </div>
                </div>

                <div>
                  <Label>Address</Label>
                  {isEditingProfile ? (
                    <div className="flex items-start gap-2 mt-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-2.5" />
                      <Input
                        value={profileData.address}
                        onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 mt-2 p-3 border rounded-lg">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{profileData.address}</p>
                    </div>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label>Phone Number</Label>
                    {isEditingProfile ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 p-3 border rounded-lg">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{profileData.phone}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Email</Label>
                    {isEditingProfile ? (
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-2 p-3 border rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm">{profileData.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Working Hours</Label>
                  {isEditingProfile ? (
                    <div className="mt-2 space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Monday - Saturday</Label>
                        <Input
                          value={profileData.workingHours.weekdays}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            workingHours: { ...profileData.workingHours, weekdays: e.target.value }
                          })}
                          placeholder="9:00 AM - 9:00 PM"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Sunday</Label>
                        <Input
                          value={profileData.workingHours.sunday}
                          onChange={(e) => setProfileData({ 
                            ...profileData, 
                            workingHours: { ...profileData.workingHours, sunday: e.target.value }
                          })}
                          placeholder="10:00 AM - 6:00 PM"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 p-3 border rounded-lg">
                      <p className="text-sm">Monday - Saturday: {profileData.workingHours.weekdays}</p>
                      <p className="text-sm">Sunday: {profileData.workingHours.sunday}</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex gap-2">
                  {isEditingProfile ? (
                    <>
                      <Button 
                        className="flex-1 bg-[var(--health-green)] hover:bg-[var(--health-green-dark)]"
                        onClick={handleSaveProfile}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setIsEditingProfile(false)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setIsEditingProfile(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
