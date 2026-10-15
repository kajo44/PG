import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  GPSPoint,
  MapMatchingResult,
  PavementCondition,
  RoadLink,
  SurveyPhoto,
} from '../types/pkrms';
import { formatSTA, haversineDistanceMeters } from '../utils/geoMath';
import {
  Car,
  Layers,
  Maximize2,
  Navigation,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface InteractiveMapProps {
  selectedRoad: RoadLink;
  photos: SurveyPhoto[];
  rawGPSPoints: GPSPoint[];
  mapMatchResult: MapMatchingResult | null;
  staInterval: number; // in meters, e.g. 100
  selectedPhoto: SurveyPhoto | null;
  onSelectPhoto: (photo: SurveyPhoto) => void;
  onAddPhotoAtCoord?: (lat: number, lng: number, sta: number) => void;
  isEditingTrack: boolean;
  onRoadGeometryChanged: (coords: [number, number][]) => void;
  geeLayerType: 'NONE' | 'SENTINEL_2' | 'NDVI' | 'SURFACE_MOISTURE';
  isLiveTrackingActive: boolean;
  onToggleLiveTracking: () => void;
  currentVehiclePointIndex: number;
  onVehiclePointIndexChange: React.Dispatch<React.SetStateAction<number>>;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  selectedRoad,
  photos,
  rawGPSPoints,
  mapMatchResult,
  staInterval,
  selectedPhoto,
  onSelectPhoto,
  isEditingTrack,
  onRoadGeometryChanged,
  geeLayerType,
  isLiveTrackingActive,
  onToggleLiveTracking,
  currentVehiclePointIndex,
  onVehiclePointIndexChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layers refs
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const geeTileLayerRef = useRef<L.TileLayer | null>(null);
  const roadLayerRef = useRef<L.Polyline | null>(null);
  const rawTrackLayerRef = useRef<L.LayerGroup | null>(null);
  const matchedTrackLayerRef = useRef<L.Polyline | null>(null);
  const deviationLinesLayerRef = useRef<L.LayerGroup | null>(null);
  const staMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const photoMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const editMarkersLayerRef = useRef<L.LayerGroup | null>(null);

  // UI state
  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite' | 'carto'>('carto');
  const [viewMode, setViewMode] = useState<'both' | 'matched_only' | 'raw_only'>('both');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showDeviationHalos, setShowDeviationHalos] = useState<boolean>(true);
  const [showStaMilestones, setShowStaMilestones] = useState<boolean>(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = selectedRoad.coordinates[0] || [-6.6582, 106.8524];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: false,
    });

    // Custom zoom control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial base tile layer
    const tileUrl =
      mapStyle === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const baseTile = L.tileLayer(tileUrl, {
      attribution: '&copy; CartoDB &copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    baseTileLayerRef.current = baseTile;

    // Layer groups
    roadLayerRef.current = L.polyline([], { color: '#0284c7', weight: 6, opacity: 0.85 }).addTo(map);
    rawTrackLayerRef.current = L.layerGroup().addTo(map);
    matchedTrackLayerRef.current = L.polyline([], { color: '#10b981', weight: 4, dashArray: '6, 6' }).addTo(map);
    deviationLinesLayerRef.current = L.layerGroup().addTo(map);
    staMarkersLayerRef.current = L.layerGroup().addTo(map);
    photoMarkersLayerRef.current = L.layerGroup().addTo(map);
    editMarkersLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !baseTileLayerRef.current) return;

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    let attr = '&copy; CartoDB &copy; OpenStreetMap';

    if (mapStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attr = '&copy; Esri &copy; Earthstar Geographics';
    } else if (mapStyle === 'osm') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attr = '&copy; OpenStreetMap contributors';
    }

    baseTileLayerRef.current.setUrl(tileUrl);
  }, [mapStyle]);

  // Update demo imagery overlay (not a Google Earth Engine connection)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (geeTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(geeTileLayerRef.current);
      geeTileLayerRef.current = null;
    }

    if (geeLayerType !== 'NONE') {
      // This is a visual demo using third-party basemap tiles, not multispectral/NDVI data from GEE.
      let overlayUrl = '';
      let opacity = 0.65;

      if (geeLayerType === 'NDVI') {
        // Vegetation index layer
        overlayUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}';
        opacity = 0.45;
      } else if (geeLayerType === 'SURFACE_MOISTURE') {
        // Soil moisture & water ponding layer
        overlayUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
        opacity = 0.5;
      } else {
        // Sentinel-2 True Color GEE composite
        overlayUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        opacity = 0.55;
      }

      const geeLayer = L.tileLayer(overlayUrl, {
        opacity,
        attribution: 'Demo overlay: Esri / OpenStreetMap contributors; not Google Earth Engine data',
      }).addTo(mapInstanceRef.current);

      geeTileLayerRef.current = geeLayer;
    }
  }, [geeLayerType]);

  // Update Road Centerline & Zoom to Bounds
  useEffect(() => {
    if (!mapInstanceRef.current || !roadLayerRef.current) return;

    const latLngs = selectedRoad.coordinates.map((c) => [c[0], c[1]] as [number, number]);
    roadLayerRef.current.setLatLngs(latLngs);

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [selectedRoad.id, selectedRoad.coordinates]);

  // Render STA Milestone Markers along road based on interval
  useEffect(() => {
    if (!mapInstanceRef.current || !staMarkersLayerRef.current) return;
    staMarkersLayerRef.current.clearLayers();

    if (!showStaMilestones) return;

    // Calculate checkpoints along road
    const coords = selectedRoad.coordinates;
    let cumDist = 0;
    let nextMilestone = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const segLen = haversineDistanceMeters(p1[0], p1[1], p2[0], p2[1]);

      while (cumDist + segLen >= nextMilestone && nextMilestone <= selectedRoad.lengthKm * 1000) {
        const t = (nextMilestone - cumDist) / (segLen || 1);
        const mLat = p1[0] + t * (p2[0] - p1[0]);
        const mLng = p1[1] + t * (p2[1] - p1[1]);

        const staLabelText = formatSTA(nextMilestone);

        // Custom M3 pill icon for STA
        const staIcon = L.divIcon({
          className: 'sta-milestone-marker',
          html: `<div style="
            background: #1e293b;
            color: #f8fafc;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 9999px;
            border: 1.5px solid #38bdf8;
            box-shadow: 0 2px 4px rgba(0,0,0,0.25);
            white-space: nowrap;
            transform: translate(-50%, -50%);
          ">${staLabelText}</div>`,
          iconSize: [60, 20],
          iconAnchor: [30, 10],
        });

        const marker = L.marker([mLat, mLng], { icon: staIcon });
        marker.bindTooltip(`Patok Hektometer / STA: ${staLabelText}<br>Ruas: ${selectedRoad.code}`);
        staMarkersLayerRef.current.addLayer(marker);

        nextMilestone += staInterval;
      }
      cumDist += segLen;
    }
  }, [selectedRoad, staInterval, showStaMilestones]);

  // Render Map-Matched vs Raw GPS Points and Deviation Lines
  useEffect(() => {
    if (
      !mapInstanceRef.current ||
      !rawTrackLayerRef.current ||
      !matchedTrackLayerRef.current ||
      !deviationLinesLayerRef.current
    )
      return;

    rawTrackLayerRef.current.clearLayers();
    deviationLinesLayerRef.current.clearLayers();

    const matchedCoords: [number, number][] = [];
    const points = mapMatchResult ? mapMatchResult.points : rawGPSPoints;

    points.forEach((pt) => {
      // 1. Raw point marker
      if (viewMode === 'both' || viewMode === 'raw_only') {
        const isSpike = pt.isAnomaly;
        const rawMarker = L.circleMarker([pt.lat, pt.lng], {
          radius: isSpike ? 6 : 4,
          fillColor: isSpike ? '#ef4444' : '#f97316',
          color: '#ffffff',
          weight: 1.5,
          opacity: 0.9,
          fillOpacity: 0.85,
        });

        rawMarker.bindPopup(`
          <div class="text-xs font-sans">
            <div class="font-bold ${isSpike ? 'text-red-600' : 'text-slate-800'}">
              ${isSpike ? '⚠️ GPS Anomaly Spike' : '📡 Raw GPS Ping'}
            </div>
            <div>Kecepatan: ${pt.speedKmh} km/jam</div>
            <div>Akurasi GPS: ±${pt.accuracyM.toFixed(1)}m</div>
            <div>Waktu: ${new Date(pt.timestamp).toLocaleTimeString()}</div>
            ${pt.distanceOffsetM !== undefined ? `<div class="text-amber-700 font-semibold mt-1">Offset dari As: ${pt.distanceOffsetM}m</div>` : ''}
            ${pt.anomalyReason ? `<div class="text-red-700 bg-red-50 p-1 rounded mt-1 text-[11px]">${pt.anomalyReason}</div>` : ''}
          </div>
        `);
        rawTrackLayerRef.current?.addLayer(rawMarker);
      }

      // 2. Snapped coordinate
      if (pt.isMatched && pt.snappedLat !== undefined && pt.snappedLng !== undefined) {
        matchedCoords.push([pt.snappedLat, pt.snappedLng]);

        // Deviation connector line
        if (showDeviationHalos && (viewMode === 'both') && pt.distanceOffsetM && pt.distanceOffsetM > 2.5) {
          const devLine = L.polyline(
            [
              [pt.lat, pt.lng],
              [pt.snappedLat, pt.snappedLng],
            ],
            {
              color: pt.isAnomaly ? '#ef4444' : '#38bdf8',
              weight: 1.5,
              dashArray: '2, 3',
              opacity: 0.6,
            }
          );
          deviationLinesLayerRef.current?.addLayer(devLine);
        }
      }
    });

    if (viewMode === 'both' || viewMode === 'matched_only') {
      matchedTrackLayerRef.current.setLatLngs(matchedCoords);
      matchedTrackLayerRef.current.setStyle({
        color: '#10b981',
        weight: 5,
        opacity: 0.9,
      });
    } else {
      matchedTrackLayerRef.current.setLatLngs([]);
    }
  }, [rawGPSPoints, mapMatchResult, viewMode, showDeviationHalos]);

  // Render Photo Inspection Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !photoMarkersLayerRef.current) return;
    photoMarkersLayerRef.current.clearLayers();

    const conditionColors: Record<PavementCondition, string> = {
      BAIK: '#22c55e',
      SEDANG: '#eab308',
      RUSAK_RINGAN: '#f97316',
      RUSAK_BERAT: '#ef4444',
    };

    photos.forEach((photo) => {
      const color = conditionColors[photo.condition];
      const isSelected = selectedPhoto?.id === photo.id;

      const photoIcon = L.divIcon({
        className: 'photo-inspection-icon',
        html: `
          <div style="
            position: relative;
            background: ${color};
            color: #ffffff;
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            border-radius: 50%;
            border: 3px solid #ffffff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            📷
            ${isSelected ? '<span style="position:absolute; -top:4px; -right:4px; width:8px; height:8px; background:#38bdf8; border-radius:50%; border:1px solid #fff;"></span>' : ''}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([photo.lat, photo.lng], { icon: photoIcon });

      marker.on('click', () => {
        onSelectPhoto(photo);
      });

      marker.bindPopup(`
        <div style="width: 220px; font-family: sans-serif;">
          <img src="${photo.imageSrc}" alt="${photo.staLabel}" style="width:100%; height:110px; object-fit:cover; border-radius:6px; margin-bottom:6px;"/>
          <div style="font-weight:700; font-size:12px; color:#0f172a;">${photo.staLabel}</div>
          <div style="display:flex; justify-content:space-between; margin-top:2px; font-size:11px;">
            <span style="font-weight:600; color:${color};">${photo.condition.replace('_', ' ')}</span>
            <span style="color:#64748b;">PCI: ${photo.pciScore} | SDI: ${photo.sdiScore}</span>
          </div>
          <div style="font-size:10px; color:#475569; margin-top:4px; max-height:40px; overflow:hidden;">
            ${photo.notes}
          </div>
        </div>
      `);

      photoMarkersLayerRef.current?.addLayer(marker);
    });
  }, [photos, selectedPhoto]);

  // Live Vehicle Simulation Playback
  useEffect(() => {
    if (!isLiveTrackingActive) return;

    const points = (mapMatchResult ? mapMatchResult.points : rawGPSPoints);
    if (!points || points.length === 0) return;

    const interval = setInterval(() => {
      onVehiclePointIndexChange((prev) => {
        const next = (prev + 1) % points.length;
        return next;
      });
    }, 1200 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isLiveTrackingActive, mapMatchResult, rawGPSPoints, playbackSpeed, onVehiclePointIndexChange]);

  // Update Live Vehicle Marker Position on Map
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const points = mapMatchResult ? mapMatchResult.points : rawGPSPoints;
    if (!points || points.length === 0) return;

    const pt = points[Math.min(currentVehiclePointIndex, points.length - 1)];
    if (!pt) return;

    const lat = pt.snappedLat !== undefined ? pt.snappedLat : pt.lat;
    const lng = pt.snappedLng !== undefined ? pt.snappedLng : pt.lng;

    const vehicleIcon = L.divIcon({
      className: 'vehicle-tracker-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
          <div class="vehicle-pulse" style="
            position: absolute;
            width: 36px;
            height: 36px;
            background: rgba(14, 165, 233, 0.45);
            border-radius: 50%;
          "></div>
          <div style="
            position: relative;
            z-index: 20;
            background: #0284c7;
            color: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.5);
            border: 2px solid #ffffff;
            transform: rotate(${pt.heading}deg);
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!vehicleMarkerRef.current) {
      const marker = L.marker([lat, lng], { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(
        mapInstanceRef.current
      );
      vehicleMarkerRef.current = marker;
    } else {
      vehicleMarkerRef.current.setLatLng([lat, lng]);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    }
  }, [currentVehiclePointIndex, mapMatchResult, rawGPSPoints]);

  // Track Editor: Render Draggable Vertex Markers when Editing
  useEffect(() => {
    if (!mapInstanceRef.current || !editMarkersLayerRef.current) return;
    editMarkersLayerRef.current.clearLayers();

    if (!isEditingTrack) return;

    selectedRoad.coordinates.forEach((coord, idx) => {
      const editIcon = L.divIcon({
        className: 'edit-vertex-marker',
        html: `
          <div style="
            width: 14px;
            height: 14px;
            background: #ffffff;
            border: 3px solid #6366f1;
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            cursor: move;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([coord[0], coord[1]], {
        icon: editIcon,
        draggable: true,
      });

      marker.on('dragend', (e) => {
        const newLatLng = e.target.getLatLng();
        const updatedCoords = [...selectedRoad.coordinates];
        updatedCoords[idx] = [newLatLng.lat, newLatLng.lng];
        onRoadGeometryChanged(updatedCoords);
      });

      editMarkersLayerRef.current?.addLayer(marker);
    });
  }, [isEditingTrack, selectedRoad.coordinates, onRoadGeometryChanged]);

  const activeTelemetryPoint = (mapMatchResult ? mapMatchResult.points : rawGPSPoints)[
    currentVehiclePointIndex
  ];

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-900">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Top Control Bar (Material 3 Surface) */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex flex-wrap items-center gap-2">
        {/* Road link info pill */}
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-slate-200/80 flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <div className="text-[11px] font-bold tracking-wide uppercase text-slate-500">
              {selectedRoad.code}
            </div>
            <div className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[200px] sm:max-w-[280px]">
              {selectedRoad.name}
            </div>
          </div>
        </div>

        {/* Map Matching Mode Toggle */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-md border border-slate-200/80 flex items-center text-xs font-medium">
          <button
            onClick={() => setViewMode('both')}
            className={`px-2.5 py-1 rounded-xl transition ${
              viewMode === 'both'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Raw & Snapped
          </button>
          <button
            onClick={() => setViewMode('matched_only')}
            className={`px-2.5 py-1 rounded-xl transition ${
              viewMode === 'matched_only'
                ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Snapped Saja
          </button>
          <button
            onClick={() => setViewMode('raw_only')}
            className={`px-2.5 py-1 rounded-xl transition ${
              viewMode === 'raw_only'
                ? 'bg-amber-600 text-white shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Raw GPS
          </button>
        </div>

        {/* Map Style Selector */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl shadow-md border border-slate-200/80 hidden sm:flex items-center text-xs">
          <button
            onClick={() => setMapStyle('carto')}
            className={`px-2 py-1 rounded-xl transition ${
              mapStyle === 'carto' ? 'bg-slate-800 text-white font-medium' : 'text-slate-600'
            }`}
          >
            GIS Light
          </button>
          <button
            onClick={() => setMapStyle('satellite')}
            className={`px-2 py-1 rounded-xl transition ${
              mapStyle === 'satellite' ? 'bg-slate-800 text-white font-medium' : 'text-slate-600'
            }`}
          >
            Satelit
          </button>
          <button
            onClick={() => setMapStyle('osm')}
            className={`px-2 py-1 rounded-xl transition ${
              mapStyle === 'osm' ? 'bg-slate-800 text-white font-medium' : 'text-slate-600'
            }`}
          >
            OSM
          </button>
        </div>
      </div>

      {/* Floating Bottom Left: Real-time Vehicle Telemetry & Playback Controller */}
      <div className="absolute bottom-4 left-3 right-3 sm:right-auto sm:max-w-md z-20 bg-slate-900/90 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Car size={16} />
            </span>
            <div>
              <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                Survey Kendaraan Real-Time
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                  LIVE
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                {activeTelemetryPoint?.staLabel || 'STA 00+000'} | Speed:{' '}
                {activeTelemetryPoint?.speedKmh || 35} km/h
              </div>
            </div>
          </div>

          {/* Play/Pause Button */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onVehiclePointIndexChange(0)}
              title="Reset ke STA 0+000"
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={onToggleLiveTracking}
              className={`px-3 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition ${
                isLiveTrackingActive
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                  : 'bg-sky-500 hover:bg-sky-600 text-white font-bold'
              }`}
            >
              {isLiveTrackingActive ? <Pause size={13} /> : <Play size={13} />}
              {isLiveTrackingActive ? 'Jeda' : 'Lacak'}
            </button>
            <button
              onClick={() =>
                setPlaybackSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))
              }
              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-mono hover:bg-slate-700 transition"
              title="Ubah kecepatan simulasi pergerakan"
            >
              {playbackSpeed}x
            </button>
          </div>
        </div>

        {/* Telemetry Numbers Grid */}
        <div className="grid grid-cols-4 gap-2 pt-2.5 text-center">
          <div className="bg-slate-800/60 p-1.5 rounded-xl">
            <div className="text-[10px] text-slate-400">STA Jalan</div>
            <div className="text-xs font-mono font-bold text-sky-400">
              {activeTelemetryPoint?.staLabel || '00+000'}
            </div>
          </div>
          <div className="bg-slate-800/60 p-1.5 rounded-xl">
            <div className="text-[10px] text-slate-400">Kecepatan</div>
            <div className="text-xs font-mono font-bold text-emerald-400">
              {activeTelemetryPoint?.speedKmh || 0} km/h
            </div>
          </div>
          <div className="bg-slate-800/60 p-1.5 rounded-xl">
            <div className="text-[10px] text-slate-400">Akurasi GPS</div>
            <div className="text-xs font-mono font-bold text-amber-400">
              ±{activeTelemetryPoint?.accuracyM.toFixed(1) || '3.2'}m
            </div>
          </div>
          <div className="bg-slate-800/60 p-1.5 rounded-xl">
            <div className="text-[10px] text-slate-400">Snap Offset</div>
            <div className="text-xs font-mono font-bold text-purple-400">
              {activeTelemetryPoint?.distanceOffsetM || 0}m
            </div>
          </div>
        </div>
      </div>

      {/* Floating Right Overlay: Quick Map Layer Toggles */}
      <div className="absolute top-16 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={() => setShowDeviationHalos((prev) => !prev)}
          title="Tampilkan garis deviasi snap ke as jalan"
          className={`p-2 rounded-2xl shadow-md border transition ${
            showDeviationHalos
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-white/95 text-slate-700 border-slate-200'
          }`}
        >
          <Sparkles size={16} />
        </button>

        <button
          onClick={() => setShowStaMilestones((prev) => !prev)}
          title="Tampilkan patok hektometer STA"
          className={`p-2 rounded-2xl shadow-md border transition ${
            showStaMilestones
              ? 'bg-sky-600 text-white border-sky-500'
              : 'bg-white/95 text-slate-700 border-slate-200'
          }`}
        >
          <Navigation size={16} />
        </button>
      </div>

      {/* Track Editor Mode Banner */}
      {isEditingTrack && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Zap size={14} /> Mode Edit Geometri Jalur Aktif (Geser titik ungu untuk merapikan kurva / anomali)
        </div>
      )}
    </div>
  );
};
