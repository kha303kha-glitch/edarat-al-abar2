import React, {useEffect, useRef, useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {Geolocation} from '@capacitor/geolocation';
import L from 'leaflet';
import {Crosshair, ExternalLink, MapPin, Trash2, X, Check} from 'lucide-react';
import type {GeoCoordinates} from '../types/models';
import {toLatinDigits} from '../utils/format';

interface LocationFieldProps {
  label?: string;
  value?: GeoCoordinates;
  onChange: (coords: GeoCoordinates | undefined) => void;
}

function sanitizeSignedCoord(raw: string): string {
  const normalized = toLatinDigits(raw);
  let out = '';
  let hasDot = false;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '-' && out.length === 0) {
      out += '-';
    } else if (ch >= '0' && ch <= '9') {
      out += ch;
    } else if (ch === '.' && !hasDot) {
      hasDot = true;
      out += out.length === 0 || out === '-' ? '0.' : '.';
    }
  }
  return out;
}

export const LocationField: React.FC<LocationFieldProps> = ({
  label = 'الموقع الجغرافي (اختياري)',
  value,
  onChange,
}) => {
  const [latText, setLatText] = useState(value ? String(value.lat) : '');
  const [lngText, setLngText] = useState(value ? String(value.lng) : '');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  useEffect(() => {
    setLatText(value ? String(value.lat) : '');
    setLngText(value ? String(value.lng) : '');
  }, [value?.lat, value?.lng]);

  const commitManualCoords = (nextLatStr: string, nextLngStr: string) => {
    const lat = Number(nextLatStr);
    const lng = Number(nextLngStr);
    if (
      nextLatStr.trim() !== '' &&
      nextLngStr.trim() !== '' &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      onChange({
        lat: Math.round(lat * 1000000) / 1000000,
        lng: Math.round(lng * 1000000) / 1000000,
        source: 'manual',
        capturedAt: new Date().toISOString(),
      });
    } else if (nextLatStr.trim() === '' && nextLngStr.trim() === '') {
      onChange(undefined);
    }
  };

  const handleCaptureGPS = async () => {
    setGpsLoading(true);
    setGpsError(null);

    if (Capacitor.isNativePlatform()) {
      try {
        await Geolocation.requestPermissions();
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 10000,
        });
        const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
        const lng = Math.round(pos.coords.longitude * 1000000) / 1000000;
        setLatText(String(lat));
        setLngText(String(lng));
        onChange({
          lat,
          lng,
          source: 'gps',
          capturedAt: new Date().toISOString(),
        });
      } catch {
        setGpsError('تعذر التقاط إشارة GPS. تأكد من تفعيل الموقع ومنح الإذن للتطبيق.');
      } finally {
        setGpsLoading(false);
      }
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsLoading(false);
      setGpsError('المتصفح أو الجهاز لا يدعم تحديد الموقع GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
        const lng = Math.round(pos.coords.longitude * 1000000) / 1000000;
        setLatText(String(lat));
        setLngText(String(lng));
        onChange({
          lat,
          lng,
          source: 'gps',
          capturedAt: new Date().toISOString(),
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('تم رفض إذن الوصول إلى الموقع. يرجى تفعيله من إعدادات المتصفح أو إدخال الإحداثيات يدوياً.');
        } else {
          setGpsError('تعذر التقاط إشارة GPS حالياً. يمكنك الاختيار من الخريطة أو الإدخال يدوياً.');
        }
      },
      {enableHighAccuracy: true, timeout: 12000, maximumAge: 10000}
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        {value && (
          <button
            type="button"
            onClick={() => {
              setLatText('');
              setLngText('');
              onChange(undefined);
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 py-1 px-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>مسح الإحداثيات</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCaptureGPS}
          disabled={gpsLoading}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F3D6E] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#0B2E54] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
        >
          <Crosshair className="h-4 w-4" />
          <span>{gpsLoading ? 'جاري تحديد GPS...' : 'التقاط موقعي (GPS)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMapModalOpen(true)}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          <MapPin className="h-4 w-4 text-[#0F3D6E]" />
          <span>تحديد على الخريطة</span>
        </button>

        {value && (
          <a
            href={`https://maps.google.com/?q=${value.lat},${value.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-[#0F3D6E] hover:bg-sky-50 transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>فتح في خرائط Google</span>
          </a>
        )}
      </div>

      {gpsError && <p className="text-xs text-red-600">{gpsError}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            خط العرض (Latitude)
          </label>
          <input
            type="text"
            inputMode="decimal"
            dir="ltr"
            value={latText}
            onChange={(e) => {
              const cleaned = sanitizeSignedCoord(e.target.value);
              setLatText(cleaned);
              commitManualCoords(cleaned, lngText);
            }}
            placeholder="مثال: 24.7136"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-left text-slate-900 placeholder:text-slate-400 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            خط الطول (Longitude)
          </label>
          <input
            type="text"
            inputMode="decimal"
            dir="ltr"
            value={lngText}
            onChange={(e) => {
              const cleaned = sanitizeSignedCoord(e.target.value);
              setLngText(cleaned);
              commitManualCoords(latText, cleaned);
            }}
            placeholder="مثال: 46.6753"
            className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-left text-slate-900 placeholder:text-slate-400 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>
      </div>

      {mapModalOpen && (
        <LeafletMapPickerModal
          initialCoords={value}
          onClose={() => setMapModalOpen(false)}
          onSelect={(coords) => {
            setLatText(String(coords.lat));
            setLngText(String(coords.lng));
            onChange(coords);
            setMapModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

interface LeafletMapPickerModalProps {
  initialCoords?: GeoCoordinates;
  onSelect: (coords: GeoCoordinates) => void;
  onClose: () => void;
}

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753];

const LeafletMapPickerModal: React.FC<LeafletMapPickerModalProps> = ({
  initialCoords,
  onSelect,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const [picked, setPicked] = useState<{lat: number; lng: number}>(
    initialCoords
      ? {lat: initialCoords.lat, lng: initialCoords.lng}
      : {lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1]}
  );
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const startLat = initialCoords?.lat ?? DEFAULT_CENTER[0];
    const startLng = initialCoords?.lng ?? DEFAULT_CENTER[1];

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: initialCoords ? 14 : 6,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const marker = L.circleMarker([startLat, startLng], {
      radius: 10,
      fillColor: '#0F3D6E',
      color: '#ffffff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.95,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Math.round(e.latlng.lat * 1000000) / 1000000;
      const lng = Math.round(e.latlng.lng * 1000000) / 1000000;
      marker.setLatLng([lat, lng]);
      setPicked({lat, lng});
    });

    mapRef.current = map;
    markerRef.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const handleCenterOnGPS = async () => {
    setLocating(true);
    if (Capacitor.isNativePlatform()) {
      try {
        await Geolocation.requestPermissions();
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
        const lng = Math.round(pos.coords.longitude * 1000000) / 1000000;
        setPicked({lat, lng});
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 15);
        }
      } catch {
        // Ignore GPS timeout inside modal
      } finally {
        setLocating(false);
      }
      return;
    }

    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 1000000) / 1000000;
        const lng = Math.round(pos.coords.longitude * 1000000) / 1000000;
        setPicked({lat, lng});
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 15);
        }
        setLocating(false);
      },
      () => setLocating(false),
      {enableHighAccuracy: true, timeout: 10000}
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex w-full max-w-2xl flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              اختر الموقع على الخريطة
            </h3>
            <p className="text-xs text-slate-500">اضغط على أي نقطة في الخريطة لتثبيت الإحداثيات</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الخريطة"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative w-full h-80 sm:h-96 bg-slate-100">
          <div ref={mapContainerRef} className="h-full w-full" />
          <button
            type="button"
            onClick={handleCenterOnGPS}
            disabled={locating}
            className="absolute bottom-3 right-3 z-[400] min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-[#0F3D6E] shadow-md border border-slate-200 hover:bg-slate-50"
          >
            <Crosshair className="h-4 w-4" />
            <span>{locating ? 'تحديد...' : 'موقعي الحالي'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-mono tabular-nums text-slate-700" dir="ltr">
            {picked.lat}, {picked.lng}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={() =>
                onSelect({
                  lat: picked.lat,
                  lng: picked.lng,
                  source: 'map',
                  capturedAt: new Date().toISOString(),
                })
              }
              className="min-h-[44px] inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0F3D6E] text-sm font-semibold text-white hover:bg-[#0B2E54]"
            >
              <Check className="h-4 w-4" />
              <span>اعتماد الموقع</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
