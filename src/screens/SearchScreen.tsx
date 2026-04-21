import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { Search, X, ArrowLeft, TrendingUp, Sparkles } from 'lucide-react-native';
import { useThemeColors } from '../lib/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { servicesService, type ServiceItem } from '../services/services';
import type { RootStackParamList } from '../types/navigation';

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const theme = useThemeColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches] = useState<string[]>(['Basic Wash', 'Premium Detail', 'Interior Clean']);

  // Auto-focus the input when screen loads
  const inputRef = React.useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, []);

  // Load services
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const servicesData = await servicesService.getServices();
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter services based on query
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();

    return services.filter((s: ServiceItem) => {
      const titleMatch = s.title.toLowerCase().includes(q);
      const descMatch = s.desc?.toLowerCase().includes(q);
      const categoryMatch = s.category?.toLowerCase().includes(q);
      return titleMatch || descMatch || categoryMatch;
    });
  }, [query, services]);

  const handleServicePress = (serviceKey: string) => {
    // Navigate directly to booking flow - no worker selection needed
    navigation.navigate('BookingDateTime', { serviceKey });
  };

  const handlePopularServicePress = (serviceName: string) => {
    // Find the service by name and navigate to booking
    const service = services.find(s => s.title.toLowerCase() === serviceName.toLowerCase());
    if (service) {
      navigation.navigate('BookingDateTime', { serviceKey: service.key });
    } else {
      // Fallback: just search for it
      setQuery(serviceName);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={[]}>
      {/* Header with Search Bar */}
      <View style={[styles.header, { backgroundColor: theme.bg, borderBottomColor: theme.cardBorder, paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.textPrimary} />
        </Pressable>

        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder={t('search_placeholder') || 'Search for services...'}
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
              <X size={18} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
        )}

        {/* Recent Searches - Show when no query */}
        {!query && !loading && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Sparkles size={18} color={theme.accent} />
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                {t('popular_services') || 'Popular Services'}
              </Text>
            </View>
            <View style={styles.recentList}>
              {recentSearches.map((search, index) => (
                <Pressable
                  key={index}
                  style={[styles.recentItem, { backgroundColor: theme.surface, borderColor: theme.cardBorder }]}
                  onPress={() => handlePopularServicePress(search)}
                >
                  <Search size={16} color={theme.textSecondary} />
                  <Text style={[styles.recentText, { color: theme.textPrimary }]}>{search}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Search Results */}
        {query && !loading && (
          <>
            {/* Services Results */}
            {searchResults.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  {t('services_title') || 'Services'} ({searchResults.length})
                </Text>
                {searchResults.map((service) => (
                  <Pressable
                    key={service.id}
                    style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}
                    onPress={() => handleServicePress(service.key)}
                  >
                    <View style={styles.resultInfo}>
                      <View style={styles.serviceHeader}>
                        <Text style={[styles.resultTitle, { color: theme.textPrimary }]}>{service.title}</Text>
                        <View style={[styles.serviceBadge, { backgroundColor: theme.accent + '15' }]}>
                          <Sparkles size={12} color={theme.accent} />
                        </View>
                      </View>
                      <Text style={[styles.resultSubtitle, { color: theme.textSecondary }]} numberOfLines={2}>
                        {service.desc}
                      </Text>
                      <View style={styles.serviceFooter}>
                        <Text style={[styles.serviceDuration, { color: theme.textSecondary }]}>
                          {service.durationMinutes || 60} min
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* No Results */}
            {searchResults.length === 0 && (
              <View style={styles.noResults}>
                <Search size={48} color={theme.textSecondary} opacity={0.3} />
                <Text style={[styles.noResultsTitle, { color: theme.textPrimary }]}>
                  {t('no_results_found') || 'No services found'}
                </Text>
                <Text style={[styles.noResultsText, { color: theme.textSecondary }]}>
                  Try searching with different keywords
                </Text>
              </View>
            )}
          </>
        )}
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
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentList: {
    gap: 8,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  recentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  resultInfo: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  serviceBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  resultSubtitle: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  serviceDuration: {
    fontSize: 12,
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
