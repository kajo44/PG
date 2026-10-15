import React, { useState } from 'react';
import { RoadLink } from '../types/pkrms';
import { haversineDistanceMeters } from '../utils/geoMath';
import {
  Check,
  Crosshair,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';

interface TrackEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  road: RoadLink;
  onSaveRoadGeometry: (newCoords: [number, number][]) => void;
}

export const TrackEditorModal: React.FC<TrackEditorModalProps> = ({
  isOpen,
  onClose,
  road,
  onSaveRoadGeometry,
}) => {
  if (!isOpen) return null;

  const [coords, setCoords] = useState<[number, number][]>([...road.coordinates]);
  const [selectedVertexIdx, setSelectedVertexIdx] = useState<number | null>(null);

  // Smooth filter algorithm: moving average over 3 neighboring points
  const handleSmoothGeometry = () => {
    if (coords.length < 3) return;
    const smoothed: [number, number][] = [coords[0]];

    for (let i = 1; i < coords.length - 1; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const next = coords[i + 1];

      const sLat = (prev[0] + curr[0] * 2 + next[0]) / 4;
      const sLng = (prev[1] + curr[1] * 2 + next[1]) / 4;
      smoothed.push([sLat, sLng]);
    }

    smoothed.push(coords[coords.length - 1]);
    setCoords(smoothed);
  };

  // Delete selected vertex
  const handleDeleteVertex = (idx: number) => {
    if (coords.length <= 2) return;
    const next = coords.filter((_, i) => i !== idx);
    setCoords(next);
    setSelectedVertexIdx(null);
  };

  // Add a midpoint between selected vertex and next
  const handleInsertMidpoint = (idx: number) => {
    if (idx >= coords.length - 1) return;
    const p1 = coords[idx];
    const p2 = coords[idx + 1];
    const mid: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];

    const next = [...coords];
    next.splice(idx + 1, 0, mid);
    setCoords(next);
  };

  // Calculate new total road length
  let totalLength = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    totalLength += haversineDistanceMeters(
      coords[i][0],
      coords[i][1],
      coords[i + 1][0],
      coords[i + 1][1]
    );
  }

  const handleSave = () => {
    onSaveRoadGeometry(coords);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Crosshair size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Editor Geometri Jalur & Perbaikan Anomali GPS
              </h3>
              <p className="text-xs text-slate-500">
                Ruas: {road.code} - {coords.length} Titik Vertex Sumbu Jalan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSmoothGeometry}
              className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100/70 font-semibold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Wand2 size={13} />
              Penghalusan Kurva (Smoothing)
            </button>
            <span className="text-slate-500">
              Panjang Baru: <strong className="text-slate-900 font-mono">{(totalLength / 1000).toFixed(2)} KM</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-500">
            *Dapat juga digeser langsung di Peta Interaktif
          </div>
        </div>

        {/* Vertex Coordinate List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-semibold text-slate-700 mb-1">
            Daftar Koordinat As Jalan (Latitude, Longitude):
          </div>

          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {coords.map((c, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedVertexIdx(idx)}
                className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between transition cursor-pointer ${
                  selectedVertexIdx === idx
                    ? 'border-indigo-500 bg-indigo-50/60 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[11px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div className="font-mono text-slate-800">
                    <span className="text-slate-400">Lat: </span>{c[0].toFixed(6)},{' '}
                    <span className="text-slate-400">Lng: </span>{c[1].toFixed(6)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {idx < coords.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertMidpoint(idx);
                      }}
                      title="Sisipkan titik tengah setelah ini"
                      className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 transition"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                  {coords.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVertex(idx);
                      }}
                      title="Hapus titik ini (outlier)"
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => setCoords([...road.coordinates])}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200 transition flex items-center gap-1"
          >
            <RefreshCw size={13} />
            Reset ke Asli
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5"
            >
              <Save size={13} />
              Simpan Perubahan Geometri
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
