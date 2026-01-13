import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { User, Language } from '../types';
import { toast } from 'sonner';

interface EditProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedUser: User) => void;
  language: Language;
}

export function EditProfileModal({ user, isOpen, onClose, onSave, language }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone,
  });

  // Reset form when modal opens with new user data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
      });
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error(language === 'en' ? 'Name is required' : 'नाम आवश्यक है');
      return;
    }
    if (!formData.email.trim()) {
      toast.error(language === 'en' ? 'Email is required' : 'ईमेल आवश्यक है');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error(language === 'en' ? 'Phone is required' : 'फोन नंबर आवश्यक है');
      return;
    }

    const updatedUser: User = {
      ...user,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    // Close the modal immediately
    onClose();
    
    // Update profile data
    onSave(updatedUser);
    
    // Show success message after modal closes
    setTimeout(() => {
      toast.success(
        language === 'en'
          ? 'Profile updated successfully!'
          : 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!'
      );
    }, 200);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Edit Profile' : 'प्रोफ़ाइल संपादित करें'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'en' ? 'Name' : 'नाम'}
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={language === 'en' ? 'Enter your name' : 'अपना नाम दर्ज करें'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              {language === 'en' ? 'Email' : 'ईमेल'}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder={language === 'en' ? 'Enter your email' : 'अपना ईमेल दर्ज करें'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">
              {language === 'en' ? 'Phone' : 'फोन'}
            </Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder={language === 'en' ? 'Enter your phone' : 'अपना फोन नंबर दर्ज करें'}
            />
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
              onClick={handleSave}
            >
              {language === 'en' ? 'Save' : 'सहेजें'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
