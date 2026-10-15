import React, { useEffect, useState } from 'react';
import {
  CloudPipelineStats,
  GPSPoint,
  MapMatchingResult,
  RoadLink,
  SurveyPhoto,
  TeamMember,
} from './types/pkrms';
import {
  INITIAL_CLOUD_STATS,
  INITIAL_SURVEY_PHOTOS,
  INITIAL_TEAM_MEMBERS,
  SAMPLE_ROAD_LINKS,
} from './data/mockRoads';
import { executeMapMatching, generateSimulatedRawGPS } from './utils/mapMatching';
import {
  clearSyncQueue,
  getPendingSyncCount,
  loadPhotosFromLocal,
  queueForCloudSync,
  savePhotosToLocal,
} from './utils/offlineSync';
import { Header } from './components/Header';
import { InteractiveMap } from './components/InteractiveMap';
import { MapMatchingPanel } from './components/MapMatchingPanel';
import { PhotoInspectionModal } from './components/PhotoInspectionModal';
import { PhotoGalleryView } from './components/PhotoGalleryView';
import { EarthEnginePanel } from './components/EarthEnginePanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ExportModal } from './components/ExportModal';
import { TrackEditorModal } from './components/TrackEditorModal';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Layers,
  MapPin,
  RefreshCw,
  Route,
  Sparkles,
  Wand2,
} from 'lucide-react';

export default function App() {
  // Road Links State
  const [roads, setRoads] = useState<RoadLink[]>(SAMPLE_ROAD_LINKS);
  const [selectedRoad, setSelectedRoad] = useState<RoadLink>(SAMPLE_ROAD_LINKS[0]);

  // Inspection Photos State (with offline local storage fallback)
  const [photos, setPhotos] = useState<SurveyPhoto[]>(() => {
    const cached = loadPhotosFromLocal();
    return cached && cached.length > 0 ? cached : INITIAL_SURVEY_PHOTOS;
  });

  // Selected Photo for Technical Evaluation Modal
  const [selectedPhoto, setSelectedPhoto] = useState<SurveyPhoto | null>(null);

  // STA Interval Filter (25, 50, 100, 200m)
  const [staInterval, setStaInterval] = useState<number>(100);

  // Raw GPS Points and Map Matching Engine Results
  const [rawGPSPoints, setRawGPSPoints] = useState<GPSPoint[]>(() =>
    generateSimulatedRawGPS(SAMPLE_ROAD_LINKS[0], 55, 7.5)
  );

  const [mapMatchResult, setMapMatchResult] = useState<MapMatchingResult | null>(() =>
    executeMapMatching(generateSimulatedRawGPS(SAMPLE_ROAD_LINKS[0], 55, 7.5), SAMPLE_ROAD_LINKS[0])
  );

  // Real-time Vehicle Tracking Playback
  const [isLiveTrackingActive, setIsLiveTrackingActive] = useState<boolean>(true);
  const [currentVehiclePointIndex, setCurrentVehiclePointIndex] = useState<number>(0);

  // Navigation and UI Views
  const [activeNavTab, setActiveNavTab] = useState<'map' | 'photos' | 'analytics' | 'earthengine'>(
    'map'
  );

  // Track Editor Mode
  const [isEditingTrackOnMap, setIsEditingTrackOnMap] = useState<boolean>(false);
  const [isTrackEditorModalOpen, setIsTrackEditorModalOpen] = useState<boolean>(false);

  // Google Earth Engine Multispectral Layer Type
  const [geeLayerType, setGeeLayerType] = useState<
    'NONE' | 'SENTINEL_2' | 'NDVI' | 'SURFACE_MOISTURE'
  >('NONE');

  // Big Data Lake (120 TB) & Distributed Cloud Pipeline
  const [cloudStats, setCloudStats] = useState<CloudPipelineStats>(INITIAL_CLOUD_STATS);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getPendingSyncCount());

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Team Members
  const [teamMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS);

  // Mobile Bottom Sheet Collapse
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState<boolean>(false);

  // Save photos locally when updated
  useEffect(() => {
    savePhotosToLocal(photos);
  }, [photos]);

  // When selected road changes, regenerate GPS simulation and execute map matching
  const handleSelectRoad = (newRoad: RoadLink) => {
    setSelectedRoad(newRoad);
    const newRaw = generateSimulatedRawGPS(newRoad, 55, 7.5);
    setRawGPSPoints(newRaw);
    const matched = executeMapMatching(newRaw, newRoad);
    setMapMatchResult(matched);
    setCurrentVehiclePointIndex(0);
  };

  // Re-run Map Matching with custom parameters
  const handleRunMapMatching = (options: { sigmaZ: number; anomalyThresholdM: number }) => {
    const result = executeMapMatching(rawGPSPoints, selectedRoad, {
      sigmaZ: options.sigmaZ,
      anomalyDistanceThresholdM: options.anomalyThresholdM,
    });
    setMapMatchResult(result);
  };

  // Generate fresh simulated GPS pings
  const handleSimulateNewGPS = () => {
    const freshRaw = generateSimulatedRawGPS(selectedRoad, 60, 8.5);
    setRawGPSPoints(freshRaw);
    const matched = executeMapMatching(freshRaw, selectedRoad);
    setMapMatchResult(matched);
    setCurrentVehiclePointIndex(0);
  };

  // Handle Photo Evaluation Save
  const handleSavePhotoEvaluation = (updatedPhoto: SurveyPhoto) => {
    const nextPhotos = photos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p));
    setPhotos(nextPhotos);

    // Queue for cloud sync
    queueForCloudSync({
      id: `sync-eval-${Date.now()}`,
      type: 'PHOTO_EVALUATION',
      payload: updatedPhoto,
      timestamp: new Date().toISOString(),
    });
    setPendingSyncCount(getPendingSyncCount());
  };

  // Import New Photo
  const handleImportNewPhoto = (newPhoto: SurveyPhoto) => {
    const nextPhotos = [newPhoto, ...photos];
    setPhotos(nextPhotos);

    queueForCloudSync({
      id: `sync-new-photo-${Date.now()}`,
      type: 'NEW_PHOTO',
      payload: newPhoto,
      timestamp: new Date().toISOString(),
    });
    setPendingSyncCount(getPendingSyncCount());
    setSelectedPhoto(newPhoto); // open for immediate evaluation
  };

  // Update Road Centerline Geometry from map drag or manual editor
  const handleRoadGeometryChanged = (newCoords: [number, number][]) => {
    const updatedRoad: RoadLink = {
      ...selectedRoad,
      coordinates: newCoords,
    };

    setRoads((prev) => prev.map((r) => (r.id === updatedRoad.id ? updatedRoad : r)));
    setSelectedRoad(updatedRoad);

    // Re-run map matching against updated geometry
    const matched = executeMapMatching(rawGPSPoints, updatedRoad);
    setMapMatchResult(matched);

    queueForCloudSync({
      id: `sync-geom-${Date.now()}`,
      type: 'TRACK_EDIT',
      payload: newCoords,
      timestamp: new Date().toISOString(),
    });
    setPendingSyncCount(getPendingSyncCount());
  };

  // Trigger Cloud Sync for 120TB distributed pipeline
  const handleTriggerCloudSync = () => {
    clearSyncQueue();
    setPendingSyncCount(0);
    setCloudStats((prev) => ({
      ...prev,
      processedTB: Math.min(prev.totalVolumeTB, prev.processedTB + 0.4),
      lastSyncTimestamp: new Date().toISOString(),
    }));
  };

  // Jump vehicle to anomaly point on map
  const handleJumpToAnomalyPoint = (pt: GPSPoint) => {
    const idx = (mapMatchResult ? mapMatchResult.points : rawGPSPoints).findIndex(
      (p) => p.id === pt.id
    );
    if (idx !== -1) {
      setCurrentVehiclePointIndex(idx);
      setIsLiveTrackingActive(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Top Header Navigation */}
      <Header
        roads={roads}
        selectedRoad={selectedRoad}
        onSelectRoad={handleSelectRoad}
        activeNavTab={activeNavTab}
        onSelectNavTab={setActiveNavTab}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        isOfflineMode={isOfflineMode}
        onToggleOffline={() => setIsOfflineMode((prev) => !prev)}
        pendingSyncCount={pendingSyncCount}
        onSyncNow={handleTriggerCloudSync}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-hidden relative">
        {/* VIEW 1: Interactive Map & Live Map Matching Tracking */}
        {activeNavTab === 'map' && (
          <div className="w-full h-full flex flex-col md:flex-row relative">
            {/* Left Main: Interactive Map */}
            <div className="flex-1 h-full relative">
              <InteractiveMap
                selectedRoad={selectedRoad}
                photos={photos}
                rawGPSPoints={rawGPSPoints}
                mapMatchResult={mapMatchResult}
                staInterval={staInterval}
                selectedPhoto={selectedPhoto}
                onSelectPhoto={(p) => setSelectedPhoto(p)}
                isEditingTrack={isEditingTrackOnMap}
                onRoadGeometryChanged={handleRoadGeometryChanged}
                geeLayerType={geeLayerType}
                isLiveTrackingActive={isLiveTrackingActive}
                onToggleLiveTracking={() => setIsLiveTrackingActive((prev) => !prev)}
                currentVehiclePointIndex={currentVehiclePointIndex}
                onVehiclePointIndexChange={setCurrentVehiclePointIndex}
              />
            </div>

            {/* Right Desktop Sidebar: Map Matching Engine Panel */}
            <div className="hidden lg:block w-96 h-full p-3 bg-slate-100 overflow-hidden shrink-0">
              <MapMatchingPanel
                selectedRoad={selectedRoad}
                mapMatchResult={mapMatchResult}
                rawPoints={rawGPSPoints}
                onRunMapMatching={handleRunMapMatching}
                onSimulateNewGPS={handleSimulateNewGPS}
                isEditingTrack={isEditingTrackOnMap}
                onToggleTrackEditor={() => {
                  setIsEditingTrackOnMap((prev) => !prev);
                  if (!isEditingTrackOnMap) setIsTrackEditorModalOpen(true);
                }}
                onJumpToAnomalyPoint={handleJumpToAnomalyPoint}
              />
            </div>

            {/* Mobile / Tablet Bottom Sheet for Map Matching Panel */}
            <div className="lg:hidden absolute bottom-0 left-0 right-0 z-30 pointer-events-auto">
              <div
                className={`bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 transition-all duration-300 ${
                  isMobilePanelExpanded ? 'h-[75vh]' : 'h-14'
                } flex flex-col overflow-hidden`}
              >
                {/* Pull handle */}
                <button
                  onClick={() => setIsMobilePanelExpanded((prev) => !prev)}
                  className="w-full py-2.5 px-4 flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 border-b border-slate-100"
                >
                  <span className="flex items-center gap-2">
                    <Route size={15} className="text-indigo-600" />
                    Panel Map Matching & Anomali (HMM Snap)
                  </span>
                  {isMobilePanelExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                </button>

                {isMobilePanelExpanded && (
                  <div className="flex-1 overflow-y-auto p-3">
                    <MapMatchingPanel
                      selectedRoad={selectedRoad}
                      mapMatchResult={mapMatchResult}
                      rawPoints={rawGPSPoints}
                      onRunMapMatching={handleRunMapMatching}
                      onSimulateNewGPS={handleSimulateNewGPS}
                      isEditingTrack={isEditingTrackOnMap}
                      onToggleTrackEditor={() => {
                        setIsEditingTrackOnMap((prev) => !prev);
                        if (!isEditingTrackOnMap) setIsTrackEditorModalOpen(true);
                      }}
                      onJumpToAnomalyPoint={handleJumpToAnomalyPoint}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Photo Documentation & Technical Evaluation per STA Interval */}
        {activeNavTab === 'photos' && (
          <div className="w-full h-full p-3 sm:p-5">
            <PhotoGalleryView
              selectedRoad={selectedRoad}
              photos={photos}
              staInterval={staInterval}
              onChangeStaInterval={setStaInterval}
              onSelectPhoto={(p) => setSelectedPhoto(p)}
              onImportNewPhoto={handleImportNewPhoto}
            />
          </div>
        )}

        {/* VIEW 3: Analytics Dashboard & Team Productivity */}
        {activeNavTab === 'analytics' && (
          <div className="w-full h-full p-3 sm:p-5">
            <AnalyticsDashboard
              roads={roads}
              selectedRoad={selectedRoad}
              photos={photos}
              teamMembers={teamMembers}
            />
          </div>
        )}

        {/* VIEW 4: Google Earth Engine & 120 TB Big Data Cloud Processing */}
        {activeNavTab === 'earthengine' && (
          <div className="w-full h-full p-3 sm:p-5">
            <EarthEnginePanel
              selectedRoad={selectedRoad}
              cloudStats={cloudStats}
              geeLayerType={geeLayerType}
              onChangeGeeLayer={setGeeLayerType}
              isOfflineMode={isOfflineMode}
              onToggleOfflineMode={() => setIsOfflineMode((prev) => !prev)}
              onTriggerCloudSync={handleTriggerCloudSync}
              pendingSyncCount={pendingSyncCount}
            />
          </div>
        )}
      </main>

      {/* MODAL 1: Photo Inspection & Condition Grading (Technical Reporting) */}
      <PhotoInspectionModal
        photo={selectedPhoto}
        selectedRoad={selectedRoad}
        onClose={() => setSelectedPhoto(null)}
        onSavePhotoEvaluation={handleSavePhotoEvaluation}
      />

      {/* MODAL 2: Automated PDF, CSV, and GeoJSON Report Export */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedRoad={selectedRoad}
        photos={photos.filter((p) => p.roadLinkId === selectedRoad.id)}
        mapMatchResult={mapMatchResult}
      />

      {/* MODAL 3: Manual Track Geometry Editor & GPS Anomaly Smoother */}
      <TrackEditorModal
        isOpen={isTrackEditorModalOpen}
        onClose={() => setIsTrackEditorModalOpen(false)}
        road={selectedRoad}
        onSaveRoadGeometry={handleRoadGeometryChanged}
      />
    </div>
  );
}
