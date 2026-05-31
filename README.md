# 🌾 Implementasi Business Intelligence Berbasis Data Warehouse untuk Sistem Rekomendasi Kecocokan Tanaman Berdasarkan Kondisi Cuaca

Projek ini merupakan bagian dari tugas yang mengintegrasikan proses **Data Engineering (ETL & Data Warehouse)**, **Data Science (Machine Learning)**, serta **Web Development (Frontend & Backend)** untuk membangun sistem rekomendasi kecocokan tanaman berdasarkan parameter lingkungan (cuaca dan kondisi tanah). Sistem ini dirancang untuk mendasari sistem analisis Business Intelligence serta aplikasi berbasis web.

---

## 📌 Anggota Tim / Penulis
* **Taufik Ramadhani** (2409116001)
* **Adella Putri** (2409116006)
* **Dwi Pebriyanto Pradana** (2409116012)
* *Fakultas Teknik, Universitas Mulawarman, Samarinda*

---

## 📂 Struktur Repositori (Folder Structure)

Berikut adalah penjelasan mengenai struktur direktori utama pada repositori ini:

* 📁 **`.vscode/`** Konfigurasi editor Visual Studio Code untuk standardisasi ruang kerja tim.
* 📁 **`Data Warehouse/`** Berisi skema, rancangan, atau skrip yang berkaitan dengan pembentukan desain *Star Schema* dan arsitektur Data Warehouse.
* 📁 **`Laporan dan Poster/`** Menyimpan dokumen publikasi projek, termasuk file *Laporan Kelompok 2_Business Intelligence_Sistem Rekomendasi Kecocokan Tanaman Berdasarkan Kondisi Cuaca.pdf* serta aset visual (poster/infografis).
* 📁 **`backend/`** Memuat source code sisi *server* (API). Bertugas untuk mengelola logika bisnis, integrasi ke basis data, dan melayani hasil prediksi model Machine Learning ke aplikasi klien.
* 📁 **`data-analysis/`** Menyimpan file hasil eksperimen analisis data, dataset CSV, serta proses pra-pemrosesan Data Science / Data Engineering.
* 📁 **`frontend/`** Memuat source code antarmuka pengguna (User Interface) berbasis web (dibangun dengan TypeScript/JavaScript). Merupakan tempat di mana end-user dapat memasukkan data cuaca dan kondisi tanah untuk mendapatkan rekomendasi.
* 📄 **`package.json` & `package-lock.json`** File konfigurasi *package manager* yang menyimpan informasi metadata proyek dan daftar dependensi/library yang digunakan dalam pengembangan web.
* 📄 **`.gitignore`** Daftar file, direktori, dan *environment variables* yang diabaikan (tidak di-track) oleh Git.
* 📄 **`README.md`** Dokumentasi utama repositori ini.

---

## 💾 Sumber Dataset (Dataset Sources)

Projek ini menggabungkan dan menyelaraskan dua sumber dataset publik dari Kaggle untuk memperoleh parameter cuaca, kondisi tanah, dan jenis komoditas tanaman:
1. **[Crop Recommendation Dataset](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset)** Menyediakan data parameter lingkungan seperti temperatur, kelembapan, dan pH untuk rekomendasi tanaman.
2. **[Crop Yield and Environmental Factors (2014-2023)](https://www.kaggle.com/datasets/madhankumar789/crop-yield-and-environmental-factors-2014-2023)** Menyediakan data historis komoditas perkebunan, tipe tanah, serta faktor lingkungan terkait.

---

## 🚀 Google Colab Notebooks

Seluruh eksperimen data engineering dan machine learning dilakukan menggunakan Google Colab yang terbagi menjadi dua tahap utama:

### 1. Tahap ETL & Perancangan Data Warehouse
Fokus pada ekstraksi data mentah, pengecekan kualitas data (missing values, duplikasi, outliers), transformasi penyelarasan atribut, penyaringan komoditas spesifik, serta pemodelan ke dalam *Star Schema*.  
🔗 **[Google Colab - ETL & Data Warehouse](https://colab.research.google.com/drive/179DlLO9-2gWVLeMu8yzDeiRrIaMMGMBt?usp=sharing)**

### 2. Tahap Pelatihan Model Machine Learning
Melakukan pemuatan data bersih hasil ETL, penyeimbangan data (*random downsampling*), pra-pemrosesan (*Label Encoding* & *StandardScaler*), melatih algoritma **Random Forest Classifier**, serta evaluasi dan ekspor model (`.pkl`).  
🔗 **[Google Colab - Machine Learning Training](https://colab.research.google.com/drive/1jbOIOkiQ26feMHlsJOzu-le-JBbd_fMv?usp=sharing)**

---

## 🏗️ Arsitektur & Pipeline Sistem

### A. Data Engineering (ETL & Star Schema)
Desain **Data Warehouse (Star Schema)** yang dioptimalkan untuk kueri analitis (BI):
* **Tabel Dimensi:** `dim_crop` (informasi unik jenis tanaman), `dim_weather` (kombinasi parameter cuaca), `dim_soil` (parameter kondisi tanah).
* **Tabel Fakta:** `fact_prediction` (Tabel sentral yang menghubungkan ketiga dimensi di atas untuk pencatatan histori data prediksi).

### B. Machine Learning Pipeline
* Model klasifikasi dibangun dengan algoritma **Random Forest** melalui tahapan: *Data Balancing*, *Feature Engineering*, *Splitting* (80:20), dan ekspor model (seperti `crop_model.pkl`, `scaler.pkl`, `label_encoder.pkl`) menggunakan `joblib`.

### C. Web Application Pipeline
* Model yang sudah diekspor diintegrasikan dengan servis di dalam folder **`backend/`**.
* Servis API backend melayani permintaan dari **`frontend/`** di mana pengguna memasukkan parameter cuaca dan tanah.
* Prediksi dikembalikan dan ditampilkan secara interaktif pada antarmuka web.

---

## 🛠️ Teknologi & Library Utama
* **Bahasa & Web:** TypeScript, JavaScript, HTML, CSS
* **Data Science & ML:** Python 3, `pandas`, `numpy`, `scikit-learn`
* **Tools Ekstra:** `joblib`, Visual Studio Code, Google Colab
