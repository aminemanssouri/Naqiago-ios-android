import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, MessageCircle, Phone, Mail, ChevronRight } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useLanguage } from '../contexts/LanguageContext';
import { useThemeColors } from '../lib/theme';

export default function HelpScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const theme = useThemeColors();

  const helpSections = [
    {
      title: t('getting_started'),
      items: [
        'How do I book a car wash?',
        'How do I choose a washer (worker)?',
        'How is the price calculated?',
        'What payment methods are supported?',
      ],
    },
    {
      title: t('managing_bookings'),
      items: [
        'Can I cancel or reschedule a booking?',
        'How do I track the status of my booking?',
        'How do I rate a washer and leave a review?',
        'Where can I find my booking history?',
      ],
    },
    {
      title: t('account_settings'),
      items: [
        'How do I create an account?',
        'How do I update my profile information?',
        'How do I change my password?',
        'How is my data protected (privacy & security)?',
      ],
    },
    {
      title: t('troubleshooting'),
      items: [
        'The app is not working / keeps crashing',
        'Payment issue or payment not confirmed',
        'My washer is late or did not show up',
        'I’m not satisfied with the service quality',
      ],
    },
  ];

  const contactOptions = [
    {
      icon: MessageCircle,
      title: t('live_chat'),
      description: t('chat_with_support'),
      action: () => Alert.alert(t('live_chat'), t('chat_feature_soon')),
    },
    {
      icon: Phone,
      title: t('call_us'),
      description: '0614580500',
      action: () => Linking.openURL('tel:0614580500'),
    },
    {
      icon: Mail,
      title: t('email_support'),
      description: 'support@naqiago.com',
      action: () => Linking.openURL('mailto:support@naqiago.com'),
    },
  ];

  const handleEmergencyCall = () => {
    Alert.alert(
      t('emergency_contact'),
      t('call_emergency_hotline'),
      [
        { text: t('cancel'), style: "cancel" },
        { text: t('call_us'), onPress: () => Linking.openURL('tel:0614580500') }
      ]
    );
  };

  const handleFAQItem = (item: string) => {
    Alert.alert(t('help_topic'), `${t('information_about').replace('{item}', item)}\n\n${t('feature_available_soon')}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top','bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.cardBorder, backgroundColor: theme.bg }]}>
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('help_center')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{t('contact_support')}</Text>
          <Card style={styles.card}>
            {contactOptions.map((option, index) => (
              <View key={index}>
                <Pressable style={styles.contactItem} onPress={option.action}>
                  <View style={[styles.contactIconContainer, { backgroundColor: theme.isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff' }]}>
                    <option.icon size={20} color={theme.accent} />
                  </View>
                  <View style={styles.contactContent}>
                    <Text style={[styles.contactTitle, { color: theme.textPrimary }]}>{option.title}</Text>
                    <Text style={[styles.contactDescription, { color: theme.textSecondary }]}>{option.description}</Text>
                  </View>
                  <ChevronRight size={20} color={theme.textSecondary} />
                </Pressable>
                {index < contactOptions.length - 1 && <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />}
              </View>
            ))}
          </Card>
        </View>

        {/* FAQ Sections */}
        {helpSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{section.title}</Text>
            <Card style={styles.card}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  <Pressable style={styles.faqItem} onPress={() => handleFAQItem(item)}>
                    <Text style={[styles.faqTitle, { color: theme.textPrimary }]}>{item}</Text>
                    <ChevronRight size={20} color={theme.textSecondary} />
                  </Pressable>
                  {itemIndex < section.items.length - 1 && <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />}
                </View>
              ))}
            </Card>
          </View>
        ))}

        {/* Emergency Contact */}
        <Card style={[styles.emergencyCard, { backgroundColor: theme.isDark ? 'rgba(220,38,38,0.12)' : '#fef2f2', borderColor: theme.isDark ? 'rgba(220,38,38,0.25)' : '#fecaca' }]}>
          <Text style={[styles.emergencyTitle, { color: theme.isDark ? '#fca5a5' : '#7f1d1d' }]}>{t('emergency_contact')}</Text>
          <Text style={[styles.emergencyDescription, { color: theme.isDark ? '#fca5a5' : '#991b1b' }]}>
            {t('urgent_safety_concern')}
          </Text>
          <Button variant="ghost" style={styles.emergencyButton} onPress={handleEmergencyCall}>
            <View style={styles.emergencyButtonContent}>
              <Phone size={16} color="#ffffff" />
              <Text style={styles.emergencyButtonText}>{t('emergency_hotline')}: 0614580500</Text>
            </View>
          </Button>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'transparent',
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 14,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'transparent',
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  separator: {
    height: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  emergencyCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emergencyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    height: 48,
  },
  emergencyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emergencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
