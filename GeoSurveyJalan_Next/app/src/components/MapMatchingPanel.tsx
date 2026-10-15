import React, { useState } from 'react';
import { GPSPoint, MapMatchingResult, RoadLink } from '../types/pkrms';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Crosshair,
  Gauge,
  HelpCircle,
  RefreshCw,
  Route,
  Settings2,
  Sliders,
  Sparkles,
  Wand2,
} from 'lucide-react';

interface MapMatchingPanelProps {
  selectedRoad: RoadLink;
  mapMatchResult: MapMatchingResult | null;
  rawPoints: GPSPoint[];
  onRunMapMatching: (options: { sigmaZ: number; anomalyThresholdM: number }) => void;
  onSimulateNewGPS: () => void;
  isEditingTrack: boolean;
  onToggleTrackEditor: () => void;
  onJumpToAnomalyPoint: (pt: GPSPoint) => void;
}

export const MapMatchingPanel: React.FC<MapMatchingPanelProps> = ({
  selectedRoad,
  mapMatchResult,
  rawPoints,
  onRunMapMatching,
  onSimulateNewGPS,
  isEditingTrack,
  onToggleTrackEditor,
  onJumpToAnomalyPoint,
}) => {
  const [sigmaZ, setSigmaZ] = useState<number>(4.5);
  const [anomalyThresholdM, setAnomalyThresholdM] = useState<number>(25);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'anomalies' | 'settings'>('metrics');

  const anomalies = mapMatchResult
    ? mapMatchResult.points.filter((p) => p.isAnomaly)
    : rawPoints.filter((p) => p.isAnomaly);

  const handleApplyMatch = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onRunMapMatching({
        sigmaZ,
        anomalyThresholdM,
      });
      setIsProcessing(false);
    }, 250);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden h-full">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-sky-50/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Route size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Engine Map Matching
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-semibold">
                  HMM + Orthogonal
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Snap akurat lintasan GPS ke as ruas jalan PKRMS
              </p>
            </div>
          </div>

          <button
            onClick={onSimulateNewGPS}
            title="Generate simulasi pings GPS baru dengan anomali drift"
            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition flex items-center gap-1 text-xs"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Simulasi GPS</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mt-3 bg-slate-100 p-1 rounded-2xl text-xs font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex-1 py-1.5 rounded-xl transition text-center ${
              activeTab === 'metrics'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Metrik Snap
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`flex-1 py-1.5 rounded-xl transition text-center flex items-center justify-center gap-1 ${
              activeTab === 'anomalies'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Anomali
            {anomalies.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {anomalies.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 rounded-xl transition text-center ${
              activeTab === 'settings'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
          >
            Parameter
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'metrics' && (
          <>
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Tingkat Akurasi Snap</div>
                <div className="text-xl font-bold text-emerald-600 mt-0.5 flex items-baseline gap-1">
                  {mapMatchResult?.confidenceScore ?? 98.4}%
                  <span className="text-[10px] text-slate-400 font-normal">HMM score</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${mapMatchResult?.confidenceScore ?? 98}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Rata-rata Deviasi</div>
                <div className="text-xl font-bold text-indigo-600 mt-0.5 flex items-baseline gap-1">
                  {mapMatchResult?.averageDeviationMeters ?? 3.2}m
                  <span className="text-[10px] text-slate-400 font-normal">dari as jalan</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  Max: {mapMatchResult?.maxDeviationMeters ?? 18.5}m
                </div>
              </div>
            </div>

            {/* Comparison detail */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100/80">
              <div className="flex items-center justify-between text-xs font-medium text-indigo-900 mb-2">
                <span>Perbandingan Jalur Lintasan</span>
                <span className="text-[10px] bg-indigo-200/60 px-2 py-0.5 rounded-full font-semibold">
                  {mapMatchResult?.rawPointCount ?? rawPoints.length} Pings GPS
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-indigo-100/60">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
                    Lintasan Mentah (Raw GPS)
                  </span>
                  <span className="font-semibold text-slate-800">Terganggu Drift & Spikes</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Hasil Map Matching
                  </span>
                  <span className="font-semibold text-emerald-700">Tepat di Sumbu Jalan (STA)</span>
                </div>
              </div>
            </div>

            {/* Quick actions button */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleApplyMatch}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Memproses Algoritma HMM...
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Jalankan Snap Map Matching
                  </>
                )}
              </button>

              <button
                onClick={onToggleTrackEditor}
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold border transition flex items-center justify-center gap-2 ${
                  isEditingTrack
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Crosshair size={14} />
                {isEditingTrack ? 'Tutup Mode Edit Geometri' : 'Edit Geometri Jalur Manual (GPS Fix)'}
              </button>
            </div>
          </>
        )}

        {activeTab === 'anomalies' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">
                Daftar GPS Outliers ({anomalies.length})
              </span>
              <span className="text-[11px] text-slate-400">Ambang: &gt;{anomalyThresholdM}m</span>
            </div>

            {anomalies.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1.5" />
                <p className="text-xs font-medium text-slate-700">Tidak ada anomali terdeteksi</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Semua titik GPS berada dalam batas toleransi ruas {selectedRoad.code}.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {anomalies.map((pt, idx) => (
                  <div
                    key={pt.id}
                    onClick={() => onJumpToAnomalyPoint(pt)}
                    className="p-2.5 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 cursor-pointer transition flex items-start gap-2.5"
                  >
                    <div className="p-1 rounded-lg bg-red-500 text-white mt-0.5">
                      <AlertTriangle size={12} />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-slate-800 flex items-center justify-between">
                        <span>Titik #{idx + 1} ({pt.id})</span>
                        <span className="text-[10px] text-red-600 font-bold">
                          +{pt.distanceOffsetM || Math.round(pt.accuracyM * 2)}m
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {pt.anomalyReason || 'Penyimpangan GPS akibat efek bayangan pepohonan/gedung'}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Speed: {pt.speedKmh} km/h</span>
                        <span>•</span>
                        <span>STA: {pt.staLabel || 'Estimasi'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>GPS Noise Std Dev (&sigma;z)</span>
                <span className="font-mono text-indigo-600">{sigmaZ} m</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="12.0"
                step="0.5"
                value={sigmaZ}
                onChange={(e) => setSigmaZ(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Nilai standar deviasi kesalahan sensor GPS penerima survey.
              </p>
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Batas Toleransi Anomali (Outlier)</span>
                <span className="font-mono text-indigo-600">{anomalyThresholdM} m</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="5"
                value={anomalyThresholdM}
                onChange={(e) => setAnomalyThresholdM(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Jarak simpangan tegak lurus maksimum sebelum titik ditandai outlier.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 space-y-1.5 text-[11px]">
              <div className="font-semibold text-slate-800">Spesifikasi Algoritma:</div>
              <div>• Hidden Markov Model (HMM) Viterbi Path Optimization</div>
              <div>• Weighted Orthogonal Vector Projection</div>
              <div>• Heading Difference Penalty Filtering (&Delta;&theta; &lt; 45&deg;)</div>
              <div>• Instantaneous Stationing (STA) Resolver</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
