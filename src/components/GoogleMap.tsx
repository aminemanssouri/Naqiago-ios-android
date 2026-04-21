import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import CustomMapMarkers from './CustomMapMarkers';

export type GoogleMapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
  price?: number | string;
  avatar?: string | number | any; // Can be URL string or require() result
  services?: string[];
  rating?: number;
};

interface GoogleMapProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    zoom?: number;
  };
  markers: GoogleMapMarker[];
  onMarkerPress?: (id: string) => void;
  onBookNow?: (id: string) => void;
  centerOn?: { latitude: number; longitude: number; zoom?: number } | null;
  myLocation?: { latitude: number; longitude: number } | null;
  selectedId?: string | null;
  darkMode?: boolean;
}

export default function GoogleMap({ 
  initialRegion, 
  markers, 
  onMarkerPress, 
  onBookNow, 
  centerOn, 
  myLocation, 
  selectedId, 
  darkMode 
}: GoogleMapProps) {
  const mapRef = useRef<MapView>(null);

  // Convert zoom level to latitudeDelta/longitudeDelta
  const zoomToDeltas = (zoom: number) => {
    const delta = Math.pow(2, 15 - zoom) * 0.006866455078125;
    return {
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
  };

  const region: Region = {
    latitude: initialRegion.latitude,
    longitude: initialRegion.longitude,
    ...zoomToDeltas(initialRegion.zoom || 13),
  };

  // Handle centerOn prop changes
  useEffect(() => {
    if (centerOn && mapRef.current) {
      const newRegion: Region = {
        latitude: centerOn.latitude,
        longitude: centerOn.longitude,
        ...zoomToDeltas(centerOn.zoom || 15),
      };
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, [centerOn]);

  // Track region changes to recompute overlay positions
  const [visibleRegion, setVisibleRegion] = useState<Region>({ ...region });
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Throttle region updates to ~60fps so overlays follow map smoothly
  const rafId = useRef<number | null>(null);
  const pendingRegion = useRef<Region | null>(null);

  const onMapLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== mapSize.width || height !== mapSize.height) {
      setMapSize({ width, height });
    }
  };

  // Render user location marker
  const renderUserLocationMarker = () => {
    if (!myLocation) return null;
    
    return (
      <Marker
        coordinate={{
          latitude: myLocation.latitude,
          longitude: myLocation.longitude,
        }}
        title="Your Location"
        pinColor="#10b981"
      />
    );
  };

  // Dark mode map style
  const darkMapStyle = [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#212121" }]
    },
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "administrative.country",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#9e9e9e" }]
    },
    {
      "featureType": "administrative.land_parcel",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "administrative.locality",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#bdbdbd" }]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [{ "color": "#181818" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#616161" }]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#1b1b1b" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.fill",
      "stylers": [{ "color": "#2c2c2c" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#8a8a8a" }]
    },
    {
      "featureType": "road.arterial",
      "elementType": "geometry",
      "stylers": [{ "color": "#373737" }]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [{ "color": "#3c3c3c" }]
    },
    {
      "featureType": "road.highway.controlled_access",
      "elementType": "geometry",
      "stylers": [{ "color": "#4e4e4e" }]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#616161" }]
    },
    {
      "featureType": "transit",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#757575" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#000000" }]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#3d3d3d" }]
    }
  ];

  return (
    <View style={styles.container}>
      <MapView
        key={`map-${darkMode ? 'dark' : 'light'}`}
        ref={mapRef}
        style={styles.map}
        onLayout={onMapLayout}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterest={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        // Explicitly clear the custom style when light mode to avoid persisting dark tiles
        customMapStyle={darkMode ? darkMapStyle : []}
        mapType="standard"
        mapPadding={{
          top: 120,   // Account for top search bar and buttons
          right: 20,
          bottom: 110, // Push content up so the Google label/logo sits above bottom nav
          left: 20,
        }}
        // Move the Google legal label/logo above the bottom navigation bar in the corner
        legalLabelInsets={{
          top: 0,
          left: 0,
          bottom: 110, // match mapPadding.bottom so it sits just above the nav/card area
          right: 10,
        }}
        onRegionChange={(r) => {
          pendingRegion.current = r as Region;
          if (rafId.current == null) {
            rafId.current = requestAnimationFrame(() => {
              if (pendingRegion.current) setVisibleRegion(pendingRegion.current);
              rafId.current = null;
            });
          }
        }}
        onRegionChangeComplete={(r) => {
          // Final snap to exact region at gesture end
          setVisibleRegion(r as Region);
        }}
        onPress={() => {
          // Deselect marker when pressing on empty map area
          if (selectedId && onMarkerPress) {
            onMarkerPress('');
          }
        }}
      >
        {/* Only render the user location pin using MapView.Marker */}
        {/* Render user location marker */}
        {renderUserLocationMarker()}
      </MapView>

      {/* Overlay worker markers without using MapView.Marker */}
      <CustomMapMarkers
        markers={markers}
        selectedId={selectedId}
        region={visibleRegion}
        mapSize={mapSize}
        insets={{ top: 120, right: 20, bottom: 110, left: 20 }}
        onPress={(id) => {
          console.log('CustomMapMarkers onPress called with id:', id);
          onMarkerPress?.(id);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    overflow: 'visible', // Ensure markers aren't clipped
  },
  
  // Removed workerMarker style block as worker markers are now overlayed
  
  // Callout styles
  calloutContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    minWidth: 250,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  ratingContainer: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  servicesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  calloutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  bookNowButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bookNowText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  calloutArrow: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
  },
});
