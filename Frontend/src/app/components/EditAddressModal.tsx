import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Address, Language } from '../types';
import { toast } from 'sonner';

interface EditAddressModalProps {
  isOpen: boolean;
  address: Address | null;
  onClose: () => void;
  onSave: (address: Address) => void;
  language: Language;
}

export function EditAddressModal({ isOpen, address, onClose, onSave, language }: EditAddressModalProps) {
  const [formData, setFormData] = useState({
    type: 'home' as 'home' | 'work' | 'other',
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    isDefault: false,
  });

  useEffect(() => {
    if (isOpen && address) {
      setFormData({
        type: address.type,
        name: address.name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark || '',
        isDefault: address.isDefault,
      });
    }
  }, [isOpen, address]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as 'home' | 'work' | 'other',
    }));
  };

  const handleSaveAddress = () => {
    if (!formData.name.trim()) {
      toast.error(language === 'en' ? 'Name is required' : 'नाम आवश्यक है');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error(language === 'en' ? 'Phone is required' : 'फोन नंबर आवश्यक है');
      return;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error(language === 'en' ? 'Phone must be 10 digits' : 'फोन नंबर 10 अंकों का होना चाहिए');
      return;
    }
    if (!formData.street.trim()) {
      toast.error(language === 'en' ? 'Street is required' : 'सड़क आवश्यक है');
      return;
    }
    if (!formData.city.trim()) {
      toast.error(language === 'en' ? 'City is required' : 'शहर आवश्यक है');
      return;
    }
    if (!formData.state.trim()) {
      toast.error(language === 'en' ? 'State is required' : 'राज्य आवश्यक है');
      return;
    }
    if (!formData.pincode.trim()) {
      toast.error(language === 'en' ? 'Pincode is required' : 'पिनकोड आवश्यक है');
      return;
    }
    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error(language === 'en' ? 'Pincode must be 6 digits' : 'पिनकोड 6 अंकों का होना चाहिए');
      return;
    }

    if (!address) {
      toast.error('Address not found');
      return;
    }

    const updatedAddress: Address = {
      ...address,
      type: formData.type,
      name: formData.name,
      phone: formData.phone,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      landmark: formData.landmark,
      isDefault: formData.isDefault,
    };

    onSave(updatedAddress);
    toast.success(language === 'en' ? 'Address updated successfully!' : 'पता सफलतापूर्वक अपडेट किया गया!');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Edit Address' : 'पता संपादित करें'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">
              {language === 'en' ? 'Address Type' : 'पता प्रकार'}
            </Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">
                  {language === 'en' ? 'Home' : 'घर'}
                </SelectItem>
                <SelectItem value="work">
                  {language === 'en' ? 'Work' : 'काम'}
                </SelectItem>
                <SelectItem value="other">
                  {language === 'en' ? 'Other' : 'अन्य'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'en' ? 'Full Name' : 'पूरा नाम'}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={language === 'en' ? 'Enter full name' : 'पूरा नाम दर्ज करें'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {language === 'en' ? 'Contact Number' : 'संपर्क नंबर'}
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={language === 'en' ? '10-digit phone number' : '10 अंकों का फोन नंबर'}
              maxLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="street">
              {language === 'en' ? 'Street Address' : 'सड़क का पता'}
            </Label>
            <Input
              id="street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder={language === 'en' ? 'Enter street address' : 'सड़क का पता दर्ज करें'}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">
                {language === 'en' ? 'City' : 'शहर'}
              </Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder={language === 'en' ? 'City' : 'शहर'}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">
                {language === 'en' ? 'State' : 'राज्य'}
              </Label>
              <Input
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder={language === 'en' ? 'State' : 'राज्य'}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pincode">
              {language === 'en' ? 'Pincode' : 'पिनकोड'}
            </Label>
            <Input
              id="pincode"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              placeholder={language === 'en' ? '6-digit pincode' : '6 अंकों का पिनकोड'}
              maxLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark">
              {language === 'en' ? 'Landmark (Optional)' : 'लैंडमार्क (वैकल्पिक)'}
            </Label>
            <Input
              id="landmark"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              placeholder={language === 'en' ? 'e.g., Near hospital, Next to park' : 'जैसे, अस्पताल के पास, पार्क के बगल में'}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="default"
              name="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isDefault: checked === true }))
              }
            />
            <Label htmlFor="default" className="cursor-pointer">
              {language === 'en' ? 'Set as default address' : 'डिफ़ॉल्ट पता के रूप में सेट करें'}
            </Label>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              {language === 'en' ? 'Cancel' : 'रद्द करें'}
            </Button>
            <Button
              className="flex-1 bg-[var(--health-blue)] hover:bg-[var(--health-blue-dark)]"
              onClick={handleSaveAddress}
            >
              {language === 'en' ? 'Save Changes' : 'परिवर्तन सहेजें'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
