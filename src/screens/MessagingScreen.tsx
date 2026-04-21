import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { Header } from '../components/ui/Header';
import { useThemeColors } from '../lib/theme';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { messagingService, AdminMessage } from '../services/messaging';

export default function MessagingScreen() {
  const theme = useThemeColors();
  const { t } = useLanguage();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('disconnected');
  const scrollViewRef = useRef<ScrollView | null>(null);
  const isSubscribedRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const myUserId = user?.id;

  const title = useMemo(() => t('messaging') || 'Messaging', [t]);

  // Function to fetch new messages
  const fetchNewMessages = async (convoId: string) => {
    try {
      const allMessages = await messagingService.listAdminMessages(convoId, 200);
      setMessages((prev) => {
        // Only update if there are new messages
        const lastId = prev.length > 0 ? prev[prev.length - 1].id : null;
        const newLastId = allMessages.length > 0 ? allMessages[allMessages.length - 1].id : null;
        
        if (lastId !== newLastId) {
          console.log('🔄 New messages detected via polling');
          return allMessages;
        }
        return prev;
      });
    } catch (e) {
      console.error('Error fetching messages:', e);
    }
  };

  // Function to setup realtime subscription (can be reused for reconnection)
  const setupSubscription = async (convoId: string) => {
    // Cleanup previous subscription if any
    if (unsubscribeRef.current) {
      console.log('🧹 Cleaning up previous subscription');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Prevent duplicate subscriptions
    if (isSubscribedRef.current) {
      console.log('⚠️ Already subscribed, skipping');
      return;
    }

    try {
      console.log('🔌 Setting up realtime subscription...');
      isSubscribedRef.current = true;
      setSubscriptionStatus('connecting');
      
      unsubscribeRef.current = messagingService.subscribeToAdminConversationMessages(
        convoId,
        (msg) => {
          console.log('📩 Realtime message received:', {
            id: msg.id,
            content: msg.content,
            sender_role: msg.sender_role,
            created_at: msg.created_at
          });
          
          // Force state update with a new array
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === msg.id);
            if (exists) {
              console.log('⚠️ Message already exists, skipping');
              return prev;
            }
            console.log('✅ Adding new message to list');
            const updated = [...prev, msg];
            lastMessageIdRef.current = msg.id;
            return updated;
          });
        },
        (status) => {
          console.log('🔌 Subscription status changed:', status);
          setSubscriptionStatus(status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to realtime updates');
            setError(null); // Clear any previous errors
            
            // Start polling as backup (every 3 seconds)
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            pollingIntervalRef.current = setInterval(() => {
              console.log('🔄 Polling for new messages...');
              fetchNewMessages(convoId);
            }, 3000);
            
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime channel error');
            setError('Realtime connection error. Using polling fallback.');
            
            // Use more frequent polling if realtime fails
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            pollingIntervalRef.current = setInterval(() => {
              fetchNewMessages(convoId);
            }, 2000);
            
          } else if (status === 'TIMED_OUT') {
            console.error('❌ Realtime subscription timed out');
            setError('Connection timed out. Using polling fallback.');
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            pollingIntervalRef.current = setInterval(() => {
              fetchNewMessages(convoId);
            }, 2000);
          }
        }
      );

      console.log('✅ Subscription setup complete');
    } catch (e: any) {
      console.error('❌ Subscription setup error:', e);
      setError(e?.message || 'Error setting up realtime connection');
      isSubscribedRef.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (!myUserId) {
        if (isMounted) {
          setError(t('authentication_required_alert') || 'Authentication required');
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        const convo = await messagingService.getOrCreateAdminConversation(myUserId);
        console.log('✅ Got conversation:', convo.id);
        
        if (isMounted) {
          setConversationId(convo.id);
        }

        const initial = await messagingService.listAdminMessages(convo.id, 200);
        console.log(`✅ Loaded ${initial.length} existing messages`);
        
        if (isMounted) {
          setMessages(initial);
        }

        // Setup realtime subscription
        await setupSubscription(convo.id);

        console.log('✅ Subscription setup complete');
      } catch (e: any) {
        console.error('❌ Messaging setup error:', e);
        if (isMounted) {
          setError(e?.message || 'Error loading messages');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      console.log('🧹 MessagingScreen unmounting, cleaning up...');
      isMounted = false;
      isSubscribedRef.current = false;
      
      // Clear polling interval
      if (pollingIntervalRef.current) {
        console.log('⏹️ Stopping polling');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      
      if (unsubscribeRef.current) {
        console.log('🔌 Removing realtime subscription');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [myUserId]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      console.log('📱 AppState changed:', appStateRef.current, '->', nextAppState);

      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        conversationId &&
        isFocused
      ) {
        console.log('🔄 App returned to foreground, reconnecting...');
        
        // Reset subscription state
        isSubscribedRef.current = false;
        
        // Refresh messages
        try {
          const allMessages = await messagingService.listAdminMessages(conversationId, 200);
          setMessages(allMessages);
          console.log(`✅ Refreshed ${allMessages.length} messages`);
        } catch (e) {
          console.error('Error refreshing messages:', e);
        }
        
        // Reconnect realtime subscription
        await setupSubscription(conversationId);
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [conversationId, isFocused]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (!scrollViewRef.current) return;
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length]);

  const handleSend = async () => {
    if (!conversationId || !myUserId) return;
    const text = draft.trim();
    if (!text) return;

    setDraft('');

    try {
      const created = await messagingService.sendAdminMessageAsWorker(conversationId, myUserId, text);
      console.log('✅ Message sent:', created.id);
      
      // Add message immediately (optimistic update)
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) {
          console.log('Message already in list');
          return prev;
        }
        console.log('Adding sent message to list');
        return [...prev, created];
      });
      
      // Also trigger a fetch to ensure consistency
      if (conversationId) {
        setTimeout(() => fetchNewMessages(conversationId), 500);
      }
    } catch (e: any) {
      console.error('Error sending message:', e);
      setDraft(text);
      setError(e?.message || (t('error') || 'Error'));
    }
  };

  const renderMessage = (m: AdminMessage) => {
    const isMine = m.sender_id === myUserId;
    return (
      <View
        key={m.id}
        style={[
          styles.messageRow,
          { justifyContent: isMine ? 'flex-end' : 'flex-start' },
        ]}
      >
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMine ? theme.accent : theme.card,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <Text style={[styles.bubbleText, { color: isMine ? '#ffffff' : theme.textPrimary }]}>
            {m.content || ''}
          </Text>
          <Text style={[styles.bubbleMeta, { color: isMine ? 'rgba(255,255,255,0.85)' : theme.textSecondary }]}>
            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={[]}>
      <Header title={title} showBackButton={false} />

      {/* Connection Status Indicator */}
      {!loading && subscriptionStatus !== 'SUBSCRIBED' && (
        <View style={[styles.statusBanner, { backgroundColor: theme.surface, borderBottomColor: theme.cardBorder }]}>
          <Text style={[styles.statusText, { color: theme.textSecondary }]}>
            {subscriptionStatus === 'connecting' 
              ? '🔌 Connecting to real-time...' 
              : pollingIntervalRef.current 
                ? '🔄 Updates via polling (every 3s)'
                : '⚠️ Connection paused'}
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.flex}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.stateText, { color: theme.textSecondary }]}>{t('loading') || 'Loading...'}</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={[styles.stateText, { color: theme.textPrimary, textAlign: 'center' }]}>{error}</Text>
            </View>
          ) : (
            <ScrollView
              ref={(r) => {
                scrollViewRef.current = r;
              }}
              style={styles.messages}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.map(renderMessage)}
            </ScrollView>
          )}

          <View style={[styles.composer, { backgroundColor: theme.card, borderTopColor: theme.cardBorder }]}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('type_message') || 'Type a message...'}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
              multiline
            />
            <Pressable
              onPress={handleSend}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: theme.accent,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Send size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 12 },
  stateText: { fontSize: 14, fontWeight: '600' },
  messages: { flex: 1, paddingHorizontal: 16 },
  messagesContent: { paddingTop: 16, paddingBottom: 16, gap: 10 },
  messageRow: { flexDirection: 'row' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleText: { fontSize: 14, fontWeight: '600' },
  bubbleMeta: { fontSize: 11, marginTop: 6 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 14,
    fontWeight: '600',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBanner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
