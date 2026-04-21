import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../types/navigation';
import { HelpCircle, Shield, FileText, Smartphone, ExternalLink } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Separator } from '../components/ui/Separator';
import { Header } from '../components/ui/Header';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';

export default function SupportLegalScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const theme = useThemeColors();
  const { t } = useLanguage();

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert('Unable to open link');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <Header 
        title={t('support_legal')} 
        onBack={() => navigation.goBack()} 
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Help Center */}
        <Card style={styles.sectionCard}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
              <HelpCircle size={18} color={theme.accent} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{t('help_center')}</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>{t('get_help_with_your_account')}</Text>
            </View>
            <Pressable onPress={() => (navigation as any).navigate('Help')} style={styles.action}>
              <ExternalLink size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
        </Card>

        {/* Privacy Policy */}
        <Card style={styles.sectionCard}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}> 
              <Shield size={18} color={theme.accent} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{t('privacy_policy')}</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>{t('read_our_privacy_policy')}</Text>
            </View>
            <Pressable
              onPress={() => openLink('https://naqiago.com/privacy-policy-app')}
              style={styles.action}
            >
              <FileText size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
          <Separator />
          <Text style={[styles.body, { color: theme.textSecondary }]}>We respect your privacy and protect your personal information. For full details on what we collect and how we use it, please read our Privacy Policy on our website.</Text>
        </Card>

        {/* Terms of Service */}
        <Card style={styles.sectionCard}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
              <FileText size={18} color={theme.accent} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{t('terms_of_service')}</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>{t('view_terms_and_conditions')}</Text>
            </View>
            <Pressable
              onPress={() => openLink('https://naqiago.com/conditions')}
              style={styles.action}
            >
              <FileText size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
          <Separator />
          <Text style={[styles.body, { color: theme.textSecondary }]}>Please read these terms carefully before using the app. They explain your rights, your responsibilities, and how bookings and payments are handled.</Text>
        </Card>

        {/* About */}
        <Card style={styles.sectionCard}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
              <Smartphone size={18} color={theme.accent} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{t('about_app')}</Text>
              <Text style={[styles.desc, { color: theme.textSecondary }]}>Naqiago — Version 1.0.0</Text>
            </View>
          </View>
          <Separator />
          <Text style={[styles.body, { color: theme.textSecondary }]}>{t('learn_more_about_app')}</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    padding: 12,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  action: {
    padding: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  desc: {
    fontSize: 13,
  },
  body: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
});
