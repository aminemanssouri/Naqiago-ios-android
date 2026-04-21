import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type MenuItem = {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  header?: React.ReactNode;
  items: MenuItem[];
  footerItems?: MenuItem[]; // e.g. Settings and Logout at the bottom
  theme: {
    bg: string;
    surface: string;
    card: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    isDark: boolean;
  };
};

export default function SideMenu({ visible, onClose, header, items, footerItems, theme }: Props) {
  const insets = useSafeAreaInsets();
  const overlay = useRef(new Animated.Value(0)).current; // 0..1
  const translateX = useRef(new Animated.Value(-320)).current; // off-screen to left

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlay, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(overlay, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -320, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [visible, overlay, translateX]);

  return (
    <View
      style={[StyleSheet.absoluteFill, { zIndex: 999 }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Dim overlay */}
      <Pressable onPress={onClose} style={StyleSheet.absoluteFill}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.35)',
            opacity: overlay,
          }}
        />
      </Pressable>

      {/* Sliding panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            backgroundColor: theme.card,
            borderRightColor: theme.cardBorder,
            transform: [{ translateX }],
            zIndex: 1000,
            elevation: 20,
            paddingTop: Math.max(insets.top, 10),
            // Do not respect safe area at bottom per request; keep a small fixed padding
            paddingBottom: 10,
            paddingLeft: Math.max(insets.left, 12),
            paddingRight: Math.max(insets.right, 12),
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}> 
          {header ?? (
            <View style={styles.brandRow}>
              <View style={[styles.brandDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.brandText, { color: theme.textPrimary }]}>Menu</Text>
            </View>
          )}
        </View>

        {/* Items */}
        <View style={styles.items}>
          {items.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => {
                if (!item.disabled) {
                  onClose();
                  requestAnimationFrame(() => item.onPress());
                }
              }}
              style={({ pressed }) => [
                styles.itemRow,
                { borderBottomColor: theme.cardBorder, opacity: item.disabled ? 0.5 : 1 },
                pressed && { backgroundColor: theme.surface },
              ]}
            >
              {item.icon && <View style={styles.icon}>{item.icon}</View>}
              <Text style={[styles.itemText, { color: theme.textPrimary }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Footer actions pinned to bottom (e.g., Settings, Logout) */}
        {footerItems && footerItems.length > 0 && (
          <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.cardBorder }}>
            {footerItems.map((fi, idx) => (
              <Pressable
                key={fi.key}
                onPress={() => {
                  onClose();
                  requestAnimationFrame(() => fi.onPress());
                }}
                style={({ pressed }) => [
                  styles.footer,
                  idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.cardBorder },
                  pressed && { backgroundColor: theme.surface },
                ]}
              >
                {fi.icon && <View style={styles.icon}>{fi.icon}</View>}
                <Text style={[styles.itemText, { color: theme.textPrimary }]}>{fi.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 300,
    borderRightWidth: 1,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '700',
  },
  items: {
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    width: 24,
    marginRight: 12,
    alignItems: 'center',
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
});
