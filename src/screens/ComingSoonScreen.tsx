import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { Bell, MessageCircle, Store, ArrowLeft } from 'lucide-react-native';
import { useThemeColors } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../contexts/LanguageContext';

export default function ComingSoonScreen() {
  const theme = useThemeColors();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ComingSoon'>>();
  const feature = route.params?.feature || 'Feature';
  const { t } = useLanguage();

  const getIcon = () => {
    if (feature === 'Messaging') return MessageCircle;
    if (feature === 'Store') return Store;
    return Bell;
  };
  
  const Icon = getIcon();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top','bottom']}>
      <View style={[styles.header, { borderBottomColor: theme.cardBorder, backgroundColor: theme.card }]}> 
        <Button 
          variant="ghost" 
          size="icon" 
          style={[styles.backButton, {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.cardBorder,
            borderRadius: 12,
            width: 40,
            height: 40,
            marginTop: 4,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 1,
          }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={20} color={theme.textPrimary} strokeWidth={2.5} />
        </Button>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t(feature)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}>
          <Icon size={56} color={theme.accent} />
        </View>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{feature} {t('is_coming_soon')}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {t('we_are_working_to_bring')} {feature.toLowerCase()} {t('to_you_stay_tuned')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
