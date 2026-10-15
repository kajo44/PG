import React, { useState } from 'react';
import { MapMatchingResult, RoadLink, SurveyPhoto } from '../types/pkrms';
import { exportPKRMSReportPDF } from '../utils/pdfExport';
import { exportPKRMStoCSV, exportTrackGeoJSON } from '../utils/csvExport';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  MapPin,
  Printer,
  Sparkles,
  X,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoad: RoadLink;
  photos: SurveyPhoto[];
  mapMatchResult: MapMatchingResult | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  selectedRoad,
  photos,
  mapMatchResult,
}) => {
  if (!isOpen) return null;

  const [inspectorName, setInspectorName] = useState<string>('Hendra Wijaya, S.T.');
  const [organization, setOrganization] = useState<string>(
    'DINAS BINA MARGA DAN PENATAAN RUANG'
  );
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const fileName = await exportPKRMSReportPDF(selectedRoad, photos, mapMatchResult, {
        inspectorName,
        organization,
        includePhotos,
      });
      setExportSuccessMsg(`Berhasil mengekspor PDF: ${fileName}`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err) {
      console.error('PDF Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const fileName = exportPKRMStoCSV(selectedRoad, photos);
      setExportSuccessMsg(`Berhasil mengunduh CSV PKRMS: ${fileName}`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err) {
      console.error('CSV Export failed', err);
    }
  };

  const handleExportGeoJSON = () => {
    try {
      exportTrackGeoJSON(selectedRoad, photos);
      setExportSuccessMsg(`Berhasil mengunduh Spatial GeoJSON.`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err) {
      console.error('GeoJSON Export failed', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Printer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Ekspor Laporan Resmi PKRMS
              </h3>
              <p className="text-xs text-slate-500">
                Format PDF standar Kementerian PUPR & CSV tabular
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

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {exportSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>{exportSuccessMsg}</span>
            </div>
          )}

          {/* Form options */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Instansi / Dinas Terkait
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Surveyor / Penanggung Jawab Lapangan
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800">Sertakan Lembar Foto Lapangan</div>
                <div className="text-[11px] text-slate-400">
                  Melampirkan foto inspeksi per interval STA dengan stamp GPS
                </div>
              </div>
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* 1. PDF Export */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <FileText size={16} />
                Ekspor Laporan PDF Otomatis (Format Resmi PKRMS)
              </span>
              <Download size={16} className="group-hover:translate-y-0.5 transition" />
            </button>

            {/* 2. CSV Export */}
            <button
              onClick={handleExportCSV}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-600" />
                Unduh Data Tabular CSV (Bina Marga Standard)
              </span>
              <Download size={15} />
            </button>

            {/* 3. GeoJSON Export */}
            <button
              onClick={handleExportGeoJSON}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition flex items-center justify-between group"
            >
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-purple-600" />
                Unduh Spatial GeoJSON (QGIS / ArcGIS / GEE)
              </span>
              <Download size={15} />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
