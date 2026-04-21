import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '../../lib/theme';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  style?: any;
  modalTitle?: string;
  getOptionSubtitle?: (option: SelectOption) => string | undefined;
  getOptionRightText?: (option: SelectOption) => string | undefined;
}

export const Select: React.FC<SelectProps> = ({ 
  placeholder = "Select option", 
  value, 
  onValueChange,
  options,
  style,
  modalTitle,
  getOptionSubtitle,
  getOptionRightText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useThemeColors();

  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <View style={style}>
      <Pressable 
        style={[
          styles.trigger,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          }
        ]}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[
          styles.triggerText,
          { color: selectedOption ? theme.textPrimary : theme.textSecondary },
          !selectedOption && styles.placeholder
        ]}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={16} color={theme.textSecondary} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={[
            styles.content,
            { backgroundColor: theme.card }
          ]}>
            {modalTitle && (
              <View style={[
                styles.modalHeader,
                { borderBottomColor: theme.cardBorder }
              ]}>
                <Text style={[
                  styles.modalHeaderText,
                  { color: theme.textPrimary }
                ]}>
                  {modalTitle}
                </Text>
              </View>
            )}
            <ScrollView style={styles.optionsList}>
              {options.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.option,
                    { borderBottomColor: theme.cardBorder },
                    value === option.value && {
                      backgroundColor: theme.isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff'
                    }
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <View style={styles.optionRow}>
                    <View style={styles.optionTexts}>
                      <Text style={[
                        styles.optionText,
                        { color: theme.textPrimary },
                        value === option.value && { color: theme.accent, fontWeight: '500' }
                      ]}>
                        {option.label}
                      </Text>
                      {!!getOptionSubtitle && !!getOptionSubtitle(option) && (
                        <Text style={[
                          styles.optionSubtitle,
                          { color: theme.textSecondary }
                        ]}>
                          {getOptionSubtitle(option)}
                        </Text>
                      )}
                    </View>
                    {!!getOptionRightText && !!getOptionRightText(option) && (
                      <Text style={[
                        styles.optionRightText,
                        { color: theme.textPrimary }
                      ]}>
                        {getOptionRightText(option)}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  triggerText: {
    fontSize: 16,
  },
  placeholder: {
    // Color will be handled by theme
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    borderRadius: 12,
    marginHorizontal: 20,
    maxHeight: 300,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalHeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsList: {
    maxHeight: 280,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionTexts: {
    flex: 1,
  },
  optionText: {
    fontSize: 16,
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  optionRightText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
