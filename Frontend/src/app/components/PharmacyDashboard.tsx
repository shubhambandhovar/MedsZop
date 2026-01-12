import { Package, CheckCircle, XCircle, TrendingUp, Clock, ShoppingBag } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PharmacyOrder, Medicine } from '../types';

interface PharmacyDashboardProps {
  pharmacyName: string;
  orders: PharmacyOrder[];
  inventory: Medicine[];
  onAcceptOrder: (orderId: string) => void;
  onRejectOrder: (orderId: string) => void;
}

export function PharmacyDashboard({
  pharmacyName,
  orders,
  inventory,
  onAcceptOrder,
  onRejectOrder,
}: PharmacyDashboardProps) {
  const pendingOrders = orders.filter((o) => o.status === 'confirmed');
  const activeOrders = orders.filter((o) => o.status === 'packed' || o.status === 'out_for_delivery');
  const completedOrders = orders.filter((o) => o.status === 'delivered');

  const stats = {
    totalOrders: orders.length,
    pendingOrders: pendingOrders.length,
    activeOrders: activeOrders.length,
    completedOrders: completedOrders.length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-[var(--health-blue)]">{pharmacyName}</h1>
        <p className="text-muted-foreground">Pharmacy Dashboard</p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
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

      {/* Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedOrders.length})
              </TabsTrigger>
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
                          <span>
                            {item.brand} × {item.quantity}
                          </span>
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
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {order.assignedTo}
                        </p>
                      </div>
                      <Badge className="bg-[var(--health-green)]">
                        {order.status === 'packed' ? 'Packed' : 'Out for Delivery'}
                      </Badge>
                    </div>

                    <div className="mb-3 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>
                            {item.brand} × {item.quantity}
                          </span>
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
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.date).toLocaleString()}
                        </p>
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
    </div>
  );
}
