import React, { useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export type LeafletMarker = {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
  price?: number | string;
};

interface LeafletMapProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    zoom?: number;
  };
  markers: LeafletMarker[];
  onMarkerPress?: (id: string) => void;
  onBookNow?: (id: string) => void;
  centerOn?: { latitude: number; longitude: number; zoom?: number } | null;
  myLocation?: { latitude: number; longitude: number } | null;
  selectedId?: string | null;
  darkMode?: boolean;
}

// Lightweight Leaflet map rendered inside a WebView using OpenStreetMap tiles
export default function LeafletMap({ initialRegion, markers, onMarkerPress, onBookNow, centerOn, myLocation, selectedId, darkMode }: LeafletMapProps) {
  const html = useMemo(() => {
    const markersJson = JSON.stringify(markers);
    const centerLat = initialRegion.latitude;
    const centerLng = initialRegion.longitude;
    const zoom = initialRegion.zoom ?? 13;
    const isDark = !!darkMode;

    // Inline HTML with Leaflet CDN
    return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin=""
  />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${isDark ? '#0b1220' : '#f1f5f9'} }
    .marker-initial {
      background: #6c2a84; color: #fff; width: 34px; height: 34px; border-radius: 17px;
      display: flex; align-items: center; justify-content: center; font-weight: 700; border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .leaflet-control-zoom { display: none !important; }
    .leaflet-popup-content { margin: 8px 10px; }
    .popup-card { font-family: -apple-system, Segoe UI, Roboto, sans-serif; min-width: 160px; color: ${isDark ? '#e5e7eb' : '#111827'} }
    .popup-title { font-size: 14px; font-weight: 600; color: ${isDark ? '#e5e7eb' : '#111827'}; margin-bottom: 2px; }
    .popup-sub { font-size: 12px; color: ${isDark ? '#94a3b8' : '#6b7280'}; margin-bottom: 8px; }
    .popup-row { display: flex; align-items: center; justify-content: space-between; }
    .popup-price { font-size: 12px; font-weight: 600; color: ${isDark ? '#fed141' : '#6c2a84'}; }
    .book-btn { background: #6c2a84; color: #fff; border: 0; border-radius: 6px; padding: 6px 10px; font-size: 12px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <script>
    const RN = window.ReactNativeWebView;
    const map = L.map('map', { zoomControl: false }).setView([${centerLat}, ${centerLng}], ${zoom});
    window.map = map; // expose globally for injected JS
    const isDark = ${isDark};
    const lightUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    const attrLight = '&copy; OpenStreetMap contributors';
    const attrDark = '&copy; OpenStreetMap, &copy; CARTO';
    L.tileLayer(isDark ? darkUrl : lightUrl, {
      maxZoom: 19,
      attribution: isDark ? attrDark : attrLight
    }).addTo(map);

    const markers = ${markersJson};
    window.markersMap = {};
    markers.forEach(m => {
      const bg = '#6c2a84';
      const initial = (m.title || ' ').charAt(0);
      const icon = L.divIcon({
        className: '',
        html: '<div class="marker-initial" style="background:' + bg + '">' + initial + '</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });
      const marker = L.marker([m.latitude, m.longitude], { icon }).addTo(map);
      window.markersMap[m.id] = { marker, initial };
      if (m.title || m.subtitle) {
        const content = '<div class="popup-card">'
          + '<div class="popup-title">' + (m.title || '') + '</div>'
          + '<div class="popup-sub">' + (m.subtitle || '') + '</div>'
          + '<div class="popup-row">'
          +   '<div class="popup-price">' + (m.price || '') + ' MAD</div>'
          +   '<button class="book-btn" id="bn-' + m.id + '">Book Now</button>'
          + '</div>'
        + '</div>';
        marker.bindPopup(content);
        marker.on('popupopen', () => {
          const btn = document.getElementById('bn-' + m.id);
          if (btn) {
            btn.addEventListener('click', function(ev) {
              ev.preventDefault();
              RN && RN.postMessage(JSON.stringify({ type: 'bookNow', id: m.id }));
            });
          }
        });
      }
      marker.on('click', () => {
        try { marker.openPopup(); } catch (e) {}
        RN && RN.postMessage(JSON.stringify({ type: 'markerPress', id: m.id }));
      });
    });
  </script>
</body>
</html>`;
  }, [initialRegion.latitude, initialRegion.longitude, initialRegion.zoom, markers, darkMode]);

  const webRef = useRef<WebView>(null);

  useEffect(() => {
    if (!centerOn || !webRef.current) return;
    const { latitude, longitude, zoom } = centerOn;
    const js = `
      try {
        if (window.map) { window.map.setView([${latitude}, ${longitude}], ${zoom ?? 13}); }
      } catch (e) {}
      true;
    `;
    webRef.current.injectJavaScript(js);
  }, [centerOn]);

  // Show/update a blue dot for user's current location
  useEffect(() => {
    if (!webRef.current) return;
    if (!myLocation) return;
    const { latitude, longitude } = myLocation;
    const js = `
      try {
        if (window.map) {
          if (!window.myLoc) {
            window.myLoc = L.circleMarker([${latitude}, ${longitude}], {
              radius: 6,
              color: '#ffffff',
              weight: 2,
              fillColor: '#2563eb',
              fillOpacity: 1
            }).addTo(window.map);
          } else {
            window.myLoc.setLatLng([${latitude}, ${longitude}]);
          }
        }
      } catch (e) {}
      true;
    `;
    webRef.current.injectJavaScript(js);
  }, [myLocation]);

  // Highlight selected marker and open its popup without rebuilding the WebView
  useEffect(() => {
    if (!webRef.current) return;
    const id = selectedId ? String(selectedId) : '';
    const js = `
      try {
        if (window.markersMap) {
          Object.keys(window.markersMap).forEach(function(k) {
            var entry = window.markersMap[k];
            if (!entry || !entry.marker) return;
            var isSel = (k === ${JSON.stringify(selectedId || '')});
            var bg = isSel ? '#fed141' : '#6c2a84';
            var initial = entry.initial || '';
            var html = '<div class="marker-initial" style="background:' + bg + '">' + initial + '</div>';
            var icon = L.divIcon({ className: '', html: html, iconSize: [34,34], iconAnchor: [17,17] });
            entry.marker.setIcon(icon);
            if (isSel) { try { entry.marker.openPopup(); } catch (e) {} }
          });
        }
      } catch (e) {}
      true;
    `;
    webRef.current.injectJavaScript(js);
  }, [selectedId]);

  return (
    <View style={styles.container}>
      <WebView
        key={`map-${darkMode ? 'dark' : 'light'}`}
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        style={[styles.webview, { backgroundColor: darkMode ? '#000000' : '#f1f5f9' }]}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowingReadAccessToURL={"/"}
        mixedContentMode="always"
        automaticallyAdjustContentInsets={false}
        setSupportMultipleWindows={false}
        onHttpError={(e) => console.warn('WebView HTTP error', e.nativeEvent)}
        onMessage={(e: any) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            if (data?.type === 'markerPress' && data?.id && onMarkerPress) {
              onMarkerPress(data.id);
            }
            if (data?.type === 'bookNow' && data?.id && onBookNow) {
              onBookNow(data.id);
            }
          } catch {}
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: '#000000' },
});
