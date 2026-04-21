import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { ArrowLeft, User, Mail, Phone, MapPin, Edit, Star, Calendar, Briefcase, UserCheck, Key, LogOut, Bell } from 'lucide-react-native';
import { useNotification } from '../contexts/NotificationContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Separator } from '../components/ui/Separator';
import { Header } from '../components/ui/Header';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { safeGoBack } from '../lib/navigation';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useThemeColors();
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  
  // Safely access notification context - may be undefined if provider is disabled
  let expoPushToken: string | undefined;
  try {
    const notificationContext = useNotification();
    expoPushToken = notificationContext?.expoPushToken;
  } catch (e) {
    // NotificationProvider is disabled
    expoPushToken = undefined;
  }
  
  const [showDebug, setShowDebug] = useState(false);

  const copyTokenToClipboard = async () => {
    if (expoPushToken) {
      Alert.alert('Push Token', expoPushToken, [
        { text: 'OK', style: 'default' }
      ]);
    } else {
      Alert.alert('Error', 'No push token available. Are you on a physical device?');
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleSignup = () => {
    navigation.navigate('Signup' as never);
  };

  const handleEditProfile = () => {
    (navigation as any).navigate('EditProfile');
  };

  const handleChangePassword = () => {
    (navigation as any).navigate('ChangePassword');
  };

  const handleSignOut = async () => {
    Alert.alert(
      t('sign_out_confirm_title'),
      t('sign_out_confirm_message'),
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: t('sign_out'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigate to login screen after successful logout
              (navigation as any).navigate('Login');
            } catch (error) {
              Alert.alert(t('error'), t('failed_sign_out'));
            }
          }
        }
      ]
    );
  };

  // Require authentication
  if (!user) {
    navigation.navigate('Login' as never);
    return null;
  }

  // Get user display data
  const displayName = user.profile?.full_name || user.email.split('@')[0];
  const userRole = user.profile?.role || 'customer';
  const joinDate = user.profile?.created_at ? new Date(user.profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : t('recently');

  return (
    <SafeAreaView edges={[]} style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header 
        title={t('profile')} 
        onBack={() => safeGoBack(navigation)}
        // rightAction={<Bell size={20} color={theme.textSecondary} />}
        onRightAction={() => setShowDebug(!showDebug)}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Debug Section for Notifications */}
        {/* {showDebug && (
          <Card style={{ marginBottom: 16, padding: 16 }}>
             <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>Notification Debug</Text>
             <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4 }}>
               {expoPushToken ? expoPushToken : 'No token yet. Check console or device settings.'}
             </Text>
             <Button 
               title={t('copy_token')} 
               onPress={copyTokenToClipboard} 
               variant="outline" 
               style={{ marginTop: 8 }}
             />
          </Card>
        )} */}

        {/* Unified Profile Card */}
        <Card style={styles.unifiedCard}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <Avatar
              src={user.profile?.avatar_url || undefined}
              size={80}
              fallback={displayName.split(' ').map((n: string) => n[0]).join('')}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>{displayName}</Text>
              <View style={[styles.roleContainer, { backgroundColor: theme.accent + '15' }]}>
                {userRole === 'worker' ? (
                  <Briefcase size={14} color={theme.accent} />
                ) : (
                  <UserCheck size={14} color={theme.accent} />
                )}
                <Text style={[styles.roleText, { color: theme.accent }]}>
                  {userRole === 'worker' ? t('service_provider') : t('customer')}
                </Text>
              </View>
              <Text style={[styles.memberSince, { color: theme.textSecondary }]}>{t('member_since')} {joinDate}</Text>
            </View>
          </View>

          {/* Role-specific Stats */}
          {userRole === 'worker' && (
            <>
              <Separator style={styles.sectionSeparator} />
              <View style={styles.statsSection}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('your_stats')}</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Star size={18} color={theme.accent} />
                    <Text style={[styles.statValue, { color: theme.textPrimary }]}>4.8</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('rating_label')}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Calendar size={18} color={theme.accent} />
                    <Text style={[styles.statValue, { color: theme.textPrimary }]}>127</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('jobs_done')}</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Contact Information */}
          <Separator style={styles.sectionSeparator} />
          <View style={styles.contactSection}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('contact_information')}</Text>
            <View style={styles.contactList}>
              <View style={styles.contactItem}>
                <Mail size={18} color={theme.textSecondary} />
                <View style={styles.contactDetails}>
                  <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>{t('email')}</Text>
                  <Text style={[styles.contactValue, { color: theme.textPrimary }]}>{user.email}</Text>
                </View>
              </View>

              {user.profile?.phone && (
                <View style={styles.contactItem}>
                  <Phone size={18} color={theme.textSecondary} />
                  <View style={styles.contactDetails}>
                    <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>{t('phone')}</Text>
                    <Text style={[styles.contactValue, { color: theme.textPrimary }]}>{user.profile.phone}</Text>
                  </View>
                </View>
              )}

              <View style={styles.contactItem}>
                <MapPin size={18} color={theme.textSecondary} />
                <View style={styles.contactDetails}>
                  <Text style={[styles.contactLabel, { color: theme.textSecondary }]}>{t('location')}</Text>
                  <Text style={[styles.contactValue, { color: theme.textPrimary }]}>Marrakech, Morocco</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Account Actions */}
          <Separator style={styles.sectionSeparator} />
          <View style={styles.actionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('account_label')}</Text>
            <View style={styles.actionsList}>
              <Button variant="ghost" style={styles.actionButton} onPress={handleEditProfile}>
                <Edit size={18} color={theme.textSecondary} style={styles.actionIcon} />
                <Text style={[styles.actionButtonText, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{t('edit profile')}</Text>
              </Button>
              <Button variant="ghost" style={styles.actionButton} onPress={handleChangePassword}>
                <Key size={18} color={theme.textSecondary} style={styles.actionIcon} />
                <Text style={[styles.actionButtonText, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">{t('change_password')}</Text>
              </Button>
              {userRole === 'worker' && (
                <Button variant="ghost" style={styles.actionButton} onPress={() => navigation.navigate('WorkerDashboard' as never)}>
                  <Text style={[styles.actionButtonText, { color: theme.textPrimary }]}>{t('worker_dashboard')}</Text>
                </Button>
              )}
              <Button variant="ghost" style={styles.actionButton} onPress={handleSignOut}>
                <LogOut size={18} color="#ef4444" style={styles.actionIcon} />
                <Text style={[styles.actionButtonText, styles.destructiveText]} numberOfLines={1} ellipsizeMode="tail">{t('sign_out')}</Text>
              </Button>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  headerActions: {
    marginLeft: 'auto',
  },
  editButton: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  // Unified card styles
  unifiedCard: {
    padding: 0,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  sectionSeparator: {
    marginVertical: 0,
    height: 1,
  },
  statsSection: {
    padding: 24,
  },
  contactSection: {
    padding: 24,
  },
  actionsSection: {
    padding: 24,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  memberSince: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  contactCard: {
    padding: 24,
    marginBottom: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  contactList: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  contactDetails: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 20,
  },
  actionsList: {
    gap: 4,
  },
  actionButton: {
    height: 48,
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  actionIcon: {
    marginRight: 0,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  destructiveText: {
    color: '#ef4444',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ProfileScreen;
