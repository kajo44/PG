import React from 'react';
import { RoadLink, SurveyPhoto, TeamMember } from '../types/pkrms';
import {
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  FileSpreadsheet,
  Gauge,
  HardHat,
  MapPin,
  PieChart,
  ShieldAlert,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  roads: RoadLink[];
  selectedRoad: RoadLink;
  photos: SurveyPhoto[];
  teamMembers: TeamMember[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  roads,
  selectedRoad,
  photos,
  teamMembers,
}) => {
  // Aggregate stats across all photos or current road
  const totalPhotos = photos.length;
  const countBaik = photos.filter((p) => p.condition === 'BAIK').length;
  const countSedang = photos.filter((p) => p.condition === 'SEDANG').length;
  const countRusakRingan = photos.filter((p) => p.condition === 'RUSAK_RINGAN').length;
  const countRusakBerat = photos.filter((p) => p.condition === 'RUSAK_BERAT').length;

  const pctBaik = totalPhotos ? Math.round((countBaik / totalPhotos) * 100) : 0;
  const pctSedang = totalPhotos ? Math.round((countSedang / totalPhotos) * 100) : 0;
  const pctRusakRingan = totalPhotos ? Math.round((countRusakRingan / totalPhotos) * 100) : 0;
  const pctRusakBerat = totalPhotos ? Math.round((countRusakBerat / totalPhotos) * 100) : 0;

  const totalKmNetwork = roads.reduce((acc, r) => acc + r.lengthKm, 0);
  const totalKmSurveyed = teamMembers.reduce((acc, tm) => acc + tm.kmSurveyed, 0);
  const targetKm = 150.0;
  const completionRate = Math.min(100, Math.round((totalKmSurveyed / targetKm) * 100));

  const avgPCI = totalPhotos
    ? Math.round(photos.reduce((acc, p) => acc + p.pciScore, 0) / totalPhotos)
    : 78;
  const avgSDI = totalPhotos
    ? Math.round(photos.reduce((acc, p) => acc + p.sdiScore, 0) / totalPhotos)
    : 45;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-sm">
            <BarChart3 size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Dashboard Analitik Produktivitas Tim & Kondisi Jalan
            </h2>
            <p className="text-xs text-slate-500">
              Evaluasi kinerja lapangan, status verifikasi teknis, dan agregasi indeks PKRMS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-white border border-slate-200 rounded-full font-medium text-slate-600 flex items-center gap-1.5 shadow-2xs">
            <Calendar size={13} className="text-indigo-600" />
            Tahun Anggaran 2026/2027
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Top KPI Cards (Material 3 Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100/80">
            <div className="flex items-center justify-between text-indigo-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Total Panjang Survei
              </span>
              <Gauge size={16} />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {totalKmSurveyed.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">KM</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-600" />
              <span>Target: {targetKm} KM ({completionRate}% tercapai)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/80">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Rata-rata PCI Indeks
              </span>
              <CheckCircle2 size={16} />
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono">
              {avgPCI} <span className="text-xs font-normal text-slate-500 font-sans">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Klasifikasi: {avgPCI >= 85 ? 'Sangat Baik' : avgPCI >= 70 ? 'Baik / Sedang' : 'Perlu Penanganan'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-100/80">
            <div className="flex items-center justify-between text-amber-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Rata-rata SDI
              </span>
              <AlertCircle size={16} />
            </div>
            <div className="text-2xl font-bold text-amber-700 font-mono">
              {avgSDI} <span className="text-xs font-normal text-slate-500 font-sans">Index</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Tingkat Deformasi Lapangan
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-100/80">
            <div className="flex items-center justify-between text-sky-700 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                Dokumentasi Foto STA
              </span>
              <Award size={16} />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {totalPhotos}{' '}
              <span className="text-xs font-normal text-slate-500 font-sans">Foto Terbit</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {photos.filter((p) => p.verified).length} Terverifikasi Audit
            </div>
          </div>
        </div>

        {/* Middle Section: Pavement Condition Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <PieChart size={15} className="text-indigo-600" />
              Distribusi Kondisi Permukaan Jalan Daerah
            </span>
            <span className="text-[11px] text-slate-500">
              Total {selectedRoad.lengthKm} KM Ruas Terpilih
            </span>
          </div>

          {/* Stacked Visual Bar */}
          <div className="w-full h-5 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${pctBaik}%` }}
              className="bg-emerald-500 hover:opacity-90 transition"
              title={`Baik: ${pctBaik}%`}
            />
            <div
              style={{ width: `${pctSedang}%` }}
              className="bg-yellow-400 hover:opacity-90 transition"
              title={`Sedang: ${pctSedang}%`}
            />
            <div
              style={{ width: `${pctRusakRingan}%` }}
              className="bg-orange-500 hover:opacity-90 transition"
              title={`Rusak Ringan: ${pctRusakRingan}%`}
            />
            <div
              style={{ width: `${pctRusakBerat}%` }}
              className="bg-red-500 hover:opacity-90 transition"
              title={`Rusak Berat: ${pctRusakBerat}%`}
            />
          </div>

          {/* Condition Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-white border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Baik: {pctBaik}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {((pctBaik * selectedRoad.lengthKm) / 100).toFixed(2)} KM
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-yellow-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                Sedang: {pctSedang}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {((pctSedang * selectedRoad.lengthKm) / 100).toFixed(2)} KM
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-orange-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                R. Ringan: {pctRusakRingan}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {((pctRusakRingan * selectedRoad.lengthKm) / 100).toFixed(2)} KM
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-red-700 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                R. Berat: {pctRusakBerat}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {((pctRusakBerat * selectedRoad.lengthKm) / 100).toFixed(2)} KM
              </div>
            </div>
          </div>
        </div>

        {/* Team Productivity Monitoring Table */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users size={15} className="text-indigo-600" />
              Produktivitas & Status Tim Lapangan
            </span>
            <span className="text-[11px] text-slate-400">
              {teamMembers.length} Personel Aktif
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Nama Surveyor</th>
                    <th className="py-2.5 px-3">Penugasan Ruas</th>
                    <th className="py-2.5 px-3 text-right">KM Survey</th>
                    <th className="py-2.5 px-3 text-right">Foto STA</th>
                    <th className="py-2.5 px-3 text-right">Akurasi Audit</th>
                    <th className="py-2.5 px-3">Kendaraan</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {member.name}
                        <div className="text-[10px] font-normal text-slate-400">
                          {member.role}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {member.assignedRuas}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">
                        {member.kmSurveyed.toFixed(1)} KM
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-700">
                        {member.photosUploaded}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {member.validationRate}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500">
                        {member.vehicle}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            member.status === 'SURVEYING'
                              ? 'bg-sky-100 text-sky-800 animate-pulse'
                              : member.status === 'ONLINE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
