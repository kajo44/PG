# Temuan Audit Awal — PKRMS GeoSurvey Pro

Audit ini didasarkan pada inspeksi statis arsip yang berhasil diekstrak oleh GitHub Actions. Temuan di bawah adalah kondisi kode sumber awal, bukan klaim bahwa fitur sudah diuji di perangkat pengguna.

## Ringkasan baseline

- Teknologi sumber: React + TypeScript + Vite (bukan aplikasi Python).
- Struktur arsip: 33 entri, sekitar 254.501 byte data tidak terkompresi.
- Area utama: peta interaktif, panel map matching, galeri/inspeksi foto, dashboard analitik, panel Earth Engine, ekspor PDF/CSV/GeoJSON, dan editor trek.
- Data awal berasal dari `src/data/mockRoads.ts`; lintasan GPS dapat dibuat melalui `generateSimulatedRawGPS`.
- Penyimpanan foto lokal menggunakan `localStorage`.
- Manifest menyebut `@google/genai`, tetapi adanya paket tersebut sendiri tidak membuktikan bahwa layanan AI telah terhubung.

## Temuan prioritas tinggi

### 1. Status sinkronisasi dapat menyesatkan dan berisiko menghilangkan antrean

Pada `src/App.tsx`, `handleTriggerCloudSync` memanggil `clearSyncQueue()` lalu mengurangi/memperbarui angka statistik lokal. Tidak terlihat permintaan jaringan ke backend dalam alur ini. Akibatnya, antrean lokal dapat dihapus tanpa bukti server menerima data.

**Tindakan:** jangan hapus antrean sebelum respons backend terkonfirmasi; sampai backend tersedia, tandai fitur sebagai simulasi/lokal dan jangan laporkan sukses sinkronisasi.

### 2. Label cloud/GEE menyatakan kemampuan yang belum terbukti

Panel dan ekspor menampilkan label seperti “120 TB Active”, “120 TB Cloud Synced Infrastructure”, serta klaim Google Earth Engine. Implementasi yang ditinjau menampilkan statistik lokal/simulasi dan overlay peta yang dijelaskan di kode sebagai simulasi; tidak ditemukan bukti koneksi backend/cloud pada alur yang diperiksa.

**Tindakan:** tampilkan status “Simulasi / belum terhubung” dengan jelas sampai konfigurasi dan pemeriksaan koneksi nyata tersedia. Jangan memasukkan klaim sinkronisasi/cloud yang belum terverifikasi ke laporan resmi.

### 3. Algoritme map matching belum menerapkan HMM/Viterbi secara sekuensial

Fungsi `executeMapMatching` memproyeksikan setiap titik GPS ke segmen garis dengan jarak terdekat. Walaupun komentar menyebut Hidden Markov Model dan emission probability, alur yang ditinjau tidak menghitung probabilitas transisi antarkandidat atau menjalankan Viterbi.

**Tindakan:** namai metode saat ini sebagai nearest-segment projection, tambahkan validasi input dan kasus tepi, lalu rancang HMM/Viterbi dengan kandidat, emisi, transisi, dan STA kumulatif yang dapat diuji.

### 4. Flag anomali tidak konsisten dengan alasan anomali

Pada `executeMapMatching`, `isAnomaly` ditentukan dari jarak terhadap ambang. Namun, lonjakan kecepatan juga dapat mengisi `anomalyReason` tanpa mengubah `isAnomaly` menjadi `true`.

**Tindakan:** gabungkan kriteria jarak dan lonjakan kecepatan ke dalam satu status anomali konsisten dan uji kedua kondisi tersebut.

## Risiko penting lain

- `localStorage` memiliki kapasitas terbatas; foto yang disimpan sebagai data URL dapat memenuhi kuota. Penyimpanan foto perlu dipindahkan ke IndexedDB atau penyimpanan file terkelola, dengan fallback dan pesan kegagalan.
- Fungsi ekspor CSV/GeoJSON harus diuji untuk data kosong, karakter khusus, koordinat invalid, serta foto yang berasal dari ruas berbeda. Pastikan filter ekspor mengikuti ruas yang dipilih.
- Fungsi proyeksi geometri menggunakan pendekatan equirectangular untuk proyeksi lokal; batas penggunaan, validasi koordinat, dan segmen degenerat perlu ditangani.
- Tidak ada bukti dari arsip ini bahwa build portable desktop tersedia; sumber adalah aplikasi web berbasis Vite. Distribusi desktop, jika dibutuhkan, memerlukan keputusan arsitektur terpisah.
- Perlu memeriksa semua pemakaian API key. Kunci rahasia tidak boleh dimasukkan ke bundle frontend; integrasi Gemini atau layanan cloud sebaiknya melalui konfigurasi aman/server.

## Urutan perbaikan yang disarankan

1. Hentikan penghapusan antrean sinkronisasi palsu dan luruskan status UI/ekspor.
2. Validasi input foto, koordinat, geometri ruas, dan data ekspor.
3. Perbaiki konsistensi penandaan anomali.
4. Tambahkan pengujian unit untuk jarak, proyeksi segmen, STA, dan map matching.
5. Implementasikan HMM/Viterbi hanya setelah kontrak data dan dataset uji disepakati.
6. Rancang penyimpanan offline yang layak untuk foto berukuran besar.
7. Hubungkan backend/GEE hanya dengan konfigurasi dan bukti respons nyata.
8. Jalankan lint, build, serta uji fungsional; catat hasilnya tanpa menyamakan build sukses dengan kebenaran fungsional.

## Batas audit

Audit ini statis. Hasil lint dan build dari CI akan dicatat terpisah. Kebenaran geospasial, kinerja, sinkronisasi jaringan, keamanan, dan kelayakan operasional belum dapat dinyatakan lulus sebelum pengujian khusus.
