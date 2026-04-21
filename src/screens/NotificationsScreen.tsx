import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Bell, MessageSquare, CalendarCheck, Check, X } from 'lucide-react-native';
import { useThemeColors } from '../lib/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';

export type NotificationItem = {
  id: string;
  type: 'booking' | 'message' | 'system';
  title: string;
  body: string;
  time: string; // e.g., '2h', 'Yesterday'
  unread?: boolean;
};

export default function NotificationsScreen() {
  const theme = useThemeColors();
  const { t } = useLanguage();
  const [tab, setTab] = useState<'activity' | 'messages'>('activity');

  const mockActivity: NotificationItem[] = [
    { id: 'n1', type: 'booking', title: t('booking_confirmed_notif'), body: 'Your wash with Ahmed is confirmed for 10:00 AM', time: '2h', unread: true },
    { id: 'n2', type: 'booking', title: t('booking_completed_notif'), body: 'Rate your experience with Omar', time: 'Yesterday' },
    { id: 'n3', type: 'system', title: t('promo'), body: 'Get 20% off your next Deluxe Wash', time: '2d' },
  ];

  const mockMessages: NotificationItem[] = [
    { id: 'm1', type: 'message', title: 'Ahmed (Pro)', body: 'I am on my way. ETA 10 mins.', time: '5m', unread: true },
    { id: 'm2', type: 'message', title: t('support_notif'), body: 'How was your recent booking?', time: '1d' },
  ];

  const data = tab === 'activity' ? mockActivity : mockMessages;

  const Header = useMemo(() => (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: theme.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: '700' }}>Notifications</Text>
        <Bell size={22} color={theme.accent} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        <TouchableOpacity onPress={() => setTab('activity')} activeOpacity={0.8}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
                   backgroundColor: tab === 'activity' ? theme.accent : theme.card, borderWidth: 1, borderColor: theme.cardBorder }}>
          <Text style={{ color: tab === 'activity' ? '#ffffff' : theme.textSecondary, fontWeight: '600' }}>Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('messages')} activeOpacity={0.8}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999,
                   backgroundColor: tab === 'messages' ? theme.accent : theme.card, borderWidth: 1, borderColor: theme.cardBorder }}>
          <Text style={{ color: tab === 'messages' ? '#ffffff' : theme.textSecondary, fontWeight: '600' }}>Messages</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [theme, tab]);

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const icon = item.type === 'booking' ? <CalendarCheck size={18} color={theme.accent} />
               : item.type === 'message' ? <MessageSquare size={18} color={theme.accent} />
               : <Bell size={18} color={theme.accent} />;
    return (
      <View style={{ backgroundColor: theme.card, marginHorizontal: 16, marginVertical: 6, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: theme.cardBorder, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.overlay }}>
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: theme.textPrimary, fontWeight: '600' }}>{item.title}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.time}</Text>
          </View>
          <Text style={{ color: theme.textSecondary, marginTop: 4 }}>{item.body}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            {item.type === 'booking' && (
              <>
                <TouchableOpacity activeOpacity={0.8} style={{ backgroundColor: theme.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                  <Text style={{ color: '#fff', fontWeight: '600' }} numberOfLines={1} ellipsizeMode="tail">View Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.8} style={{ backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                  <Text style={{ color: theme.textPrimary, fontWeight: '600' }} numberOfLines={1} ellipsizeMode="tail">Rate</Text>
                </TouchableOpacity>
              </>
            )}
            {item.type === 'message' && (
              <TouchableOpacity activeOpacity={0.8} style={{ backgroundColor: theme.accent, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }} numberOfLines={1} ellipsizeMode="tail">Reply</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {item.unread && (
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginTop: 4 }} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'right', 'bottom', 'left']}>
      <View style={{ flex: 1 }}>
        {Header}
        <FlatList
          data={data}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 6, paddingBottom: 24 }}
          ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 24 }}>No notifications</Text>}
        />
      </View>
    </SafeAreaView>
  );
}
