import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { ChevronDown, Search, Check } from 'lucide-react-native';
import { useThemeColors } from '../../lib/theme';

export interface ComboBoxOption {
  id: string | number;
  label: string;
  value: string | number;
}

interface ComboBoxProps {
  options: ComboBoxOption[];
  value?: string | number | null;
  onSelect: (option: ComboBoxOption) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  style?: any;
  maxHeight?: number;
}

export function ComboBox({
  options,
  value,
  onSelect,
  placeholder = 'Select an option',
  searchable = true,
  disabled = false,
  style,
  maxHeight = 300,
}: ComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const colors = useThemeColors();

  const selectedOption = options.find(option => option.value === value);
  
  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleSelect = (option: ComboBoxOption) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleOpen = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={[
          styles.trigger,
          {
            backgroundColor: disabled ? colors.surface + '80' : colors.surface,
            borderColor: colors.cardBorder,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
        disabled={disabled}
      >
        <Text
          style={[
            styles.triggerText,
            {
              color: selectedOption ? colors.textPrimary : colors.textSecondary,
            },
          ]}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown
          size={20}
          color={colors.textSecondary}
          style={[
            styles.chevron,
            { transform: [{ rotate: isOpen ? '180deg' : '0deg' }] },
          ]}
        />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <View style={styles.modalContainer}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View
                style={[
                  styles.dropdown,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.cardBorder,
                    maxHeight: maxHeight + (searchable ? 60 : 0),
                  },
                ]}
              >
                {searchable && (
                  <View
                    style={[
                      styles.searchContainer,
                      {
                        backgroundColor: colors.surface,
                        borderBottomColor: colors.cardBorder,
                      },
                    ]}
                  >
                    <Search size={16} color={colors.textSecondary} />
                    <TextInput
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                      placeholder="Search..."
                      style={[styles.searchInput, { color: colors.textPrimary }]}
                      placeholderTextColor={colors.textSecondary}
                      autoFocus
                    />
                  </View>
                )}

                <ScrollView
                  style={[styles.optionsList, { maxHeight }]}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                      const isSelected = option.value === value;
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => handleSelect(option)}
                          style={[
                            styles.option,
                            {
                              backgroundColor: isSelected
                                ? colors.accent + '20'
                                : 'transparent',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              {
                                color: isSelected ? colors.accent : colors.textPrimary,
                                fontWeight: isSelected ? '600' : '400',
                              },
                            ]}
                          >
                            {option.label}
                          </Text>
                          {isSelected && (
                            <Check size={16} color={colors.accent} />
                          )}
                        </Pressable>
                      );
                    })
                  ) : (
                    <View style={styles.noResults}>
                      <Text
                        style={[styles.noResultsText, { color: colors.textSecondary }]}
                      >
                        No options found
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  triggerText: {
    fontSize: 16,
    flex: 1,
  },
  chevron: {
    marginLeft: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Math.min(screenWidth - 32, 400),
    maxHeight: screenHeight * 0.7,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
