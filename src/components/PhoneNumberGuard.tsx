import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { PhoneNumberModal } from './ui/PhoneNumberModal';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

interface PhoneNumberGuardProps {
  children: React.ReactNode;
}

export const PhoneNumberGuard: React.FC<PhoneNumberGuardProps> = ({ children }) => {
  const { user, refreshUser } = useAuth();
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    // Only decide after we have a profile row: show modal iff phone is missing/blank.
    if (!user?.profile) {
      setShowPhoneModal(false);
      return;
    }
    const raw = user.profile.phone;
    const hasPhone = typeof raw === 'string' && raw.trim() !== '';
    setShowPhoneModal(!hasPhone);
  }, [user]);

  const handleSavePhone = async (phoneNumber: string) => {
    if (!user) return;
    
    try {
      await authService.updateProfile(user.id, { phone: phoneNumber });
      await refreshUser();
      setShowPhoneModal(false);
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      <PhoneNumberModal
        visible={showPhoneModal}
        onSave={handleSavePhone}
      />
    </View>
  );
};
