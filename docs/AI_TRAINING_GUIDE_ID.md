# Panduan Training AI Denah - PomahLiving

Dokumen ini menjelaskan data apa yang paling bagus untuk training AI denah dan bagaimana menjalankan loop pembelajaran produksi dengan aman.

## 1. Prinsip Utama

1. Jangan mulai dari train model dari nol.
2. Gunakan model fondasi + fine-tuning + rule geometri.
3. Validitas denah lebih penting daripada visual semata.

## 2. Data Training yang Disarankan

### A. Data Vektor (Prioritas Tertinggi)
- Sumber: SVG, DXF, JSON denah.
- Label: walls, rooms, doors, windows, openings, boundary.
- Kelebihan: geometri eksplisit, minim ambigu, cocok untuk rule-check.

### B. Data Gambar Denah
- Sumber: PNG/JPG/PDF hasil scan atau render.
- Wajib dipasangkan dengan ground truth vektor.
- Kegunaan: mode upload image dan robust parsing denah lama.

### C. Data Requirement Pengguna
- Parameter: ukuran tanah, kamar tidur, kamar mandi, tipe dapur, extras.
- Preset lokal: 36/72, 45/90, 60/120, 90/144.
- Kegunaan: model memahami pola preferensi Indonesia.

### D. Data Feedback Produksi
- Diterima/ditolak/edit hasil AI.
- Jarak edit (edit distance), rating, catatan user.
- Kegunaan: fine-tuning dan model ranking berbasis user nyata.

## 3. Labeling dan Normalisasi

1. Satuan diseragamkan ke meter.
2. Koordinat dinormalisasi dengan origin yang konsisten.
3. Nama ruang distandarkan (ruang_tamu, kamar_tidur, kamar_mandi, dapur, dll).
4. Tambahkan quality flags: overlap, room terlalu kecil, opening tidak valid.

## 4. Skema Loop Belajar Produksi

1. Generate denah -> simpan job + versi.
2. User pilih/apply/edit -> simpan feedback event.
3. Builder dataset mengambil sampel accepted/edited/applied.
4. Jalankan training run dengan dataset beku.
5. Bandingkan metrik model lama vs baru.
6. Canary deploy model baru.

## 5. Metrik Evaluasi Wajib

1. Validity score:
- Tidak ada overlap fatal.
- Tidak ada wall panjang nol.
- Semua opening berada pada boundary relevan.

2. Functional score:
- Adjacency ruang masuk akal.
- Sirkulasi utama tidak buntu.

3. Edit-effort score:
- Seberapa besar perubahan user setelah AI generate.

4. Acceptance score:
- Persentase versi AI yang langsung dipakai user.

## 6. Split Dataset yang Direkomendasikan

1. Train: 70%
2. Validation: 15%
3. Test: 15%

Pastikan split berbasis proyek/rumah unik agar tidak leakage antar split.

## 7. Checklist Kualitas Data

1. Lisensi data jelas untuk penggunaan komersial.
2. Tidak ada data duplikat massif.
3. File rusak dan anotasi konflik dibuang.
4. Outlier ditandai, tidak langsung dihapus.

## 8. Strategi Model Bertahap

1. Tahap 1 (MVP):
- Rule-heavy + model fondasi untuk draft layout.

2. Tahap 2 (Growth):
- Fine-tuning dari feedback produksi.
- Tambah ranking model.

3. Tahap 3 (Scale):
- Distillation model.
- Personalisasi berdasarkan segmen user.

## 9. Integrasi dengan Komponen Backend Saat Ini

- `generate-floorplan`: menghasilkan dan menyimpan job/versi.
- `submit-ai-feedback`: menyimpan feedback user.
- `build-training-dataset`: membangun snapshot dataset dari feedback produksi.

## 10. Kesalahan Umum yang Harus Dihindari

1. Training hanya dari gambar tanpa ground truth vektor.
2. Mengabaikan feedback edit user.
3. Mengukur model hanya dari confidence internal, bukan outcome user.
4. Deploy model baru tanpa canary dan rollback cepat.
