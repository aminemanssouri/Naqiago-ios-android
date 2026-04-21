import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, RefreshControl, Modal } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MapPin, Plus, MoreVertical, Home, Briefcase } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Header } from '../components/ui/Header';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { listAddresses, setDefaultAddress, deleteAddress } from '../services/addresses';
import type { Address } from '../types/address';

export default function AddressesScreen() {
  const navigation = useNavigation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [activeAddress, setActiveAddress] = useState<Address | null>(null);
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { t } = useLanguage();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listAddresses(false); // bypass cache to ensure fresh data
      setAddresses(rows);
    } catch (e) {
      // optional: show toast
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const getTypeIcon = () => MapPin;

  const handleAddressAction = async (action: string, addressId: string, displayTitle: string) => {
    switch (action) {
      case 'edit':
        Alert.alert(t('edit_address'), t('edit_functionality_coming_soon').replace('{label}', displayTitle));
        break;
      case 'delete':
        try {
          await deleteAddress(addressId);
          await load();
        } catch {}
        break;
      case 'setDefault':
        try {
          await setDefaultAddress(addressId);
          await load();
        } catch {}
        break;
    }
  };

  const showAddressOptions = (address: Address) => {
    setActiveAddress(address);
    setActionSheetVisible(true);
  };

  const closeActionSheet = () => {
    setActionSheetVisible(false);
    setActiveAddress(null);
  };

  const handleAddNewAddress = () => {
    (navigation as any).navigate('AddAddress');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <Header 
        title={t('manage_addresses')} 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        {/* Add New Address Button */}
        <Button style={styles.addButton} onPress={handleAddNewAddress}>
          <View style={styles.addButtonContent}>
            <Plus size={20} color="#ffffff" />
            <Text style={styles.addButtonText} numberOfLines={1} ellipsizeMode="tail">{t('add_new_address')}</Text>
          </View>
        </Button>

        {/* Addresses List */}
        <View style={styles.addressesList}>
          {addresses.map((address) => {
            const IconComponent = getTypeIcon();
            return (
              <Card key={address.id} style={styles.addressCard}>
                <View style={styles.addressContent}>
                  <View style={[styles.addressIconContainer, { backgroundColor: theme.overlay }]}>
                    <IconComponent size={20} color={theme.accent} />
                  </View>
                  <View style={styles.addressInfo}>
                    <View style={styles.addressHeader}>
                      <Text style={[styles.addressLabel, { color: theme.textPrimary }]}>{address.title || t('address')}</Text>
                      {address.is_default && (
                        <Badge variant="secondary" style={{ ...styles.defaultBadge, backgroundColor: theme.surface }}>
                          <Text style={[styles.defaultBadgeText, { color: theme.textPrimary }]}>{t('default')}</Text>
                        </Badge>
                      )}
                    </View>
                    <Text style={[styles.addressText, { color: theme.textSecondary }]}>{address.address_line_1 || ''}</Text>
                  </View>
                  <Pressable 
                    style={styles.moreButton} 
                    onPress={() => showAddressOptions(address)}
                  >
                    <MoreVertical size={16} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>

        {addresses.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <MapPin size={48} color={theme.textSecondary} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>{t('no_addresses_saved')}</Text>
            <Text style={[styles.emptyDescription, { color: theme.textSecondary }]}
            >
              {t('add_frequently_used_addresses')}
            </Text>
            <Button style={styles.emptyButton} onPress={handleAddNewAddress}>
              <Text style={styles.emptyButtonText}>{t('add_your_first_address')}</Text>
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Action Sheet Modal */}
      <Modal
        visible={actionSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={closeActionSheet}
      >
        <Pressable style={[styles.sheetOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]} onPress={closeActionSheet}>
          <View />
        </Pressable>
        <View style={[styles.sheetContainer, { backgroundColor: theme.surface, paddingBottom: Math.max(insets.bottom + 20, 44) }]}> 
          <View style={styles.sheetHandle}>
            <View style={[styles.sheetHandleBar, { backgroundColor: theme.cardBorder }]} />
          </View>
          <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
            {activeAddress?.title || t('address')}
          </Text>

          <View style={styles.sheetItems}>
            <Pressable
              style={[styles.sheetItem, { borderColor: theme.cardBorder }]}
              onPress={() => { if (activeAddress) { (navigation as any).navigate('EditAddress', { id: activeAddress.id }); } closeActionSheet(); }}
            >
              <Text style={[styles.sheetItemText, { color: theme.textPrimary }]}>{t('edit_address')}</Text>
            </Pressable>

            <Pressable
              disabled={!!activeAddress?.is_default}
              style={[
                styles.sheetItem,
                { borderColor: theme.cardBorder },
                activeAddress?.is_default ? { opacity: 0.5 } : null,
              ]}
              onPress={async () => { if (activeAddress && !activeAddress.is_default) { await handleAddressAction('setDefault', activeAddress.id, activeAddress.title || t('address')); } closeActionSheet(); }}
            >
              <Text style={[styles.sheetItemText, { color: theme.textPrimary }]}>{t('set_as_default')}</Text>
            </Pressable>

            <Pressable
              style={[styles.sheetItem, { borderColor: theme.cardBorder }]}
              onPress={async () => { if (activeAddress) { await handleAddressAction('delete', activeAddress.id, activeAddress.title || t('address')); } closeActionSheet(); }}
            >
              <Text style={[styles.sheetItemText, { color: '#EF4444' }]}>{t('delete_address')}</Text>
            </Pressable>

            <Pressable style={[styles.sheetCancel, { backgroundColor: theme.overlay }]} onPress={closeActionSheet}>
              <Text style={[styles.sheetCancelText, { color: theme.textPrimary }]}>{t('cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  addButton: {
    height: 48,
    marginBottom: 16,
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  addressesList: {
    gap: 12,
  },
  addressCard: {
    padding: 16,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressInfo: {
    flex: 1,
    minWidth: 0,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  defaultBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  moreButton: {
    padding: 8,
  },
  // Action Sheet Styles
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
  sheetHandleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sheetItems: {
    paddingHorizontal: 12,
    gap: 10,
  },
  sheetItem: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sheetItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  sheetCancel: {
    marginTop: 6,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    height: 44,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
