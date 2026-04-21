import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useThemeColors } from '../lib/theme';
import { useLanguage, type AppLanguage } from '../contexts/LanguageContext';

const LANGS: { key: AppLanguage; labelKey: string; sub?: string }[] = [
  { key: 'en', labelKey: 'english' },
  { key: 'fr', labelKey: 'french' },
];

export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const theme = useThemeColors();
  const { language, setLanguage, t } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }] }>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.cardBorder, paddingTop: insets.top + 12 }]}>
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
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{t('language')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Card style={{ padding: 12 }}>
          {LANGS.map((item, idx) => {
            const selected = language === item.key;
            return (
              <View key={item.key}>
                <Pressable
                  style={[styles.row, { borderColor: theme.cardBorder }]}
                  onPress={async () => {
                    await setLanguage(item.key, true);
                    // After change, go back so navbar/tab labels reflect new language
                    navigation.goBack();
                  }}
                >
                  <View style={styles.radioOuter}>
                    {selected ? (
                      <View style={[styles.radioInner, { backgroundColor: theme.accent }]} />
                    ) : null}
                  </View>
                  <Text style={[styles.langText, { color: theme.textPrimary }]}>{t(item.labelKey)}</Text>
                  {selected && <Check size={18} color={theme.accent} style={{ marginLeft: 'auto' }} />}
                </Pressable>
                {idx < LANGS.length - 1 && <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />}
              </View>
            );
          })}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: { width: 40, height: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  langText: { fontSize: 16, fontWeight: '500' },
  separator: { height: 1, opacity: 0.6 },
});
