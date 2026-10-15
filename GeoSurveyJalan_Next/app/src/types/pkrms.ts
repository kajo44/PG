export type PavementCondition = 'BAIK' | 'SEDANG' | 'RUSAK_RINGAN' | 'RUSAK_BERAT';
export type PavementType = 'ASPAL' | 'BETON' | 'KERIKIL' | 'TANAH';

export interface RoadLink {
  id: string;
  code: string; // e.g. "RUAS-042"
  name: string; // e.g. "Jl. Raya Ciawi - Puncak KM 12-25"
  province: string;
  kabupaten: string;
  lengthKm: number;
  widthMeters: number;
  startSta: number; // 0
  endSta: number; // e.g. 13000 (13 km)
  primaryPavement: PavementType;
  coordinates: [number, number][]; // [lat, lng] array representing road geometry
}

export interface GPSPoint {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  speedKmh: number;
  heading: number;
  accuracyM: number;
  timestamp: string;
  isMatched?: boolean;
  snappedLat?: number;
  snappedLng?: number;
  distanceOffsetM?: number;
  sta?: number;
  staLabel?: string;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface MapMatchingResult {
  roadLinkId: string;
  rawPointCount: number;
  matchedPointCount: number;
  averageDeviationMeters: number;
  maxDeviationMeters: number;
  confidenceScore: number; // 0 - 100%
  anomaliesDetected: number;
  computationTimeMs: number;
  points: GPSPoint[];
}

export interface DefectItem {
  type: string; // e.g. "Lubang", "Retak Buaya", "Alur Roda", "Amblas", "Bahu Jalan Rusak"
  severity: 'Rendah' | 'Sedang' | 'Tinggi';
  extentPercent: number;
}

export interface SurveyPhoto {
  id: string;
  roadLinkId: string;
  sta: number; // in meters, e.g. 1250
  staLabel: string; // e.g. "STA 01+250"
  lat: number;
  lng: number;
  imageSrc: string;
  thumbnailSrc?: string;
  timestamp: string;
  surveyor: string;
  condition: PavementCondition;
  pavementType: PavementType;
  sdiScore: number; // Surface Distress Index (0 - 150)
  pciScore: number; // Pavement Condition Index (0 - 100)
  defects: DefectItem[];
  laneWidthMeters: number;
  notes: string;
  verified: boolean;
  syncedToCloud: boolean;
  drainageCondition: 'Baik' | 'Tersumbat' | 'Rusak';
}

export interface SurveySession {
  id: string;
  roadLinkId: string;
  surveyorName: string;
  vehiclePlate: string;
  vehicleType: string;
  startTime: string;
  endTime?: string;
  currentSpeedKmh: number;
  currentHeading: number;
  currentSta: number;
  currentLat: number;
  currentLng: number;
  totalDistanceMeters: number;
  isLiveTracking: boolean;
  isOfflineMode: boolean;
  syncStatus: 'SYNCED' | 'SYNCING' | 'PENDING_OFFLINE';
  pendingSyncCount: number;
}

export interface CloudPipelineStats {
  totalVolumeTB: number; // 120 TB
  processedTB: number;
  distributedNodes: number;
  throughputMBps: number;
  cloudBucket: string;
  activeRegion: string;
  geeConnected: boolean;
  geeLayerType: 'SENTINEL_2' | 'NDVI' | 'SURFACE_MOISTURE' | 'TERRAIN_ELEVATION';
  satelliteTileCoveragePercent: number;
  lastSyncTimestamp: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  assignedRuas: string;
  kmSurveyed: number;
  photosUploaded: number;
  validationRate: number;
  vehicle: string;
  status: 'ONLINE' | 'SURVEYING' | 'STANDBY';
}
