import React, { useMemo } from 'react';
import { View, Pressable, Text, StyleSheet, Image } from 'react-native';
import { Region } from 'react-native-maps';

export type OverlayMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  price?: number | string;
  avatar?: string | number | any;
};

type Props = {
  markers: OverlayMarker[];
  selectedId?: string | null;
  region: Region;
  mapSize: { width: number; height: number };
  insets?: { top: number; right: number; bottom: number; left: number };
  onPress?: (id: string) => void;
};

// Project lat/lng to world pixel at given zoom using Web Mercator
function project(lat: number, lng: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  const siny = Math.min(Math.max(sin, -0.9999), 0.9999);
  // Normalized Web Mercator in [0..1]
  const x = (lng + 180) / 360;
  const y = 0.5 - (Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI));
  return { x, y }; // normalized [0..1] at zoom 0 tile size
}

export default function CustomMapMarkers({ markers, selectedId, region, mapSize, insets, onPress }: Props) {
  const positions = useMemo(() => {
    const { width, height } = mapSize;
    if (!width || !height) return {} as Record<string, { x: number; y: number }>;
    const padLeft = insets?.left ?? 0;
    const padRight = insets?.right ?? 0;
    const padTop = insets?.top ?? 0;
    const padBottom = insets?.bottom ?? 0;
    const contentWidth = Math.max(1, width - padLeft - padRight);
    const contentHeight = Math.max(1, height - padTop - padBottom);
    const contentCenterX = padLeft + contentWidth / 2;
    const contentCenterY = padTop + contentHeight / 2;

    const zoom = Math.log2(360 / region.longitudeDelta);
    const scale = Math.pow(2, zoom) * 256; // world pixel scale
    const center = project(region.latitude, region.longitude);
    const centerPx = { x: center.x * scale, y: center.y * scale };

    const out: Record<string, { x: number; y: number }> = {};
    for (const m of markers) {
      const p = project(m.latitude, m.longitude);
      let px = p.x * scale;
      const py = p.y * scale;
      // Handle wrap-around in X to choose nearest representation
      let dx = px - centerPx.x;
      const worldW = scale;
      if (dx > worldW / 2) dx -= worldW;
      if (dx < -worldW / 2) dx += worldW;
      const screenX = contentCenterX + dx;
      const screenY = contentCenterY + (py - centerPx.y);
      out[m.id] = { x: screenX, y: screenY };
    }
    return out;
  }, [markers, region, mapSize, insets]);

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {markers.map((m) => {
        const pos = positions[m.id];
        if (!pos) return null; // Not ready yet
        const isSelected = selectedId === m.id;
        const size = isSelected ? 50 : 44;
        const radius = size / 2;
        const innerSize = Math.max(1, size - 6);
        return (
          <View
            key={m.id}
            pointerEvents="auto"
            style={[
              styles.markerContainer,
              { transform: [{ translateX: pos.x - radius }, { translateY: pos.y - radius }] }
            ]}
          >
            <Pressable
              onPress={() => {
                console.log('Pressable onPress called for marker:', m.id);
                onPress?.(m.id);
              }}
              style={{ width: size, height: size }}
            >
              <View style={[styles.circle, { width: size, height: size, borderRadius: radius, borderWidth: isSelected ? 4 : 3, borderColor: isSelected ? '#3b82f6' : '#ef4444' }]}> 
                {m.avatar ? (
                  <Image
                    source={typeof m.avatar === 'string' ? { uri: m.avatar } : m.avatar}
                    style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={[styles.initial, { color: isSelected ? '#3b82f6' : '#ef4444' }]}> 
                    {m.title?.charAt(0) || 'W'}
                  </Text>
                )}
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  circle: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  initial: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
