# Implementasi Business Intelligence Berbasis Data Warehouse untuk Sistem Rekomendasi Kecocokan Tanaman Berdasarkan Kondisi Cuaca Menggunakan Algoritma Random Forest

Projek ini merupakan bagian dari Tugas Akhir/Projek yang mengintegrasikan proses **Data Engineering (ETL & Data Warehouse)** dan **Data Science (Machine Learning)** untuk membangun sistem rekomendasi kecocokan tanaman berdasarkan parameter lingkungan (cuaca dan kondisi tanah). Sistem ini dirancang untuk mendasari sistem analisis Business Intelligence serta aplikasi berbasis web.

---

## 📌 Anggota Tim / Penulis
* **Taufik Ramadhani** (2409116001)
* **Adella Putri** (2409116006)
* **Dwi Pebriyanto Pradana** (2409116012)
* *Fakultas Teknik, Universitas Mulawarman, Samarinda (2026)*

---

## 📂 Sumber Dataset (Dataset Sources)
Projek ini menggabungkan dan menyelaraskan dua sumber dataset publik dari Kaggle untuk memperoleh parameter cuaca, kondisi tanah, dan jenis komoditas tanaman:
1. **Crop Recommendation Dataset** 🔗 [Kaggle Link](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset)  
   *Menyediakan data parameter lingkungan seperti temperatur, kelembapan, dan pH untuk rekomendasi tanaman.*
2. **Crop Yield and Environmental Factors (2014-2023)** 🔗 [Kaggle Link](https://www.kaggle.com/datasets/madhankumar789/crop-yield-and-environmental-factors-2014-2023)  
   *Menyediakan data historis komoditas perkebunan, tipe tanah, serta faktor lingkungan terkait.*

---

## 🚀 Google Colab Notebooks
Seluruh eksperimen data engineering dan machine learning dilakukan menggunakan Google Colab yang terbagi menjadi dua tahap utama:

### 1. Tahap ETL & Perancangan Data Warehouse
Notebook ini berfokus pada ekstraksi data mentah, pengecekan kualitas data (missing values, duplikasi, pencilan/outliers menggunakan metode IQR), transformasi penyelarasan atribut, penyaringan 8 komoditas spesifik, serta pemodelan ke dalam struktur *Star Schema*.
* **Tautan Akses:** [Google Colab - ETL & Data Warehouse](https://colab.research.google.com/drive/179DlLO9-2gWVLeMu8yzDeiRrIaMMGMBt?usp=sharing)

### 2. Tahap Pelatihan Model Machine Learning
Notebook ini melakukan pemuatan data bersih hasil ETL (`crop_dataset.csv`), penyeimbangan data (*random downsampling* menjadi masing-masing 100 sampel per kelas), pra-pemrosesan (*Label Encoding* dan *StandardScaler*), pelatihan menggunakan algoritma **Random Forest Classifier**, evaluasi performa (Akurasi, Precision, Recall, F1-Score), serta ekspor artefak model menggunakan `joblib`.
* **Tautan Akses:** [Google Colab - Machine Learning Training](https://colab.research.google.com/drive/1jbOIOkiQ26feMHlsJOzu-le-JBbd_fMv?usp=sharing)

---

## 🏗️ Arsitektur & Pipeline Sistem

### A. Data Engineering (ETL & Star Schema)
Proses transformasi menghasilkan sebuah desain **Data Warehouse (Star Schema)** yang optimal untuk proses query analitis (BI):
* **Tabel Dimensi:**
  * `dim_crop`: Menyimpan informasi unik mengenai jenis tanaman (`crop_id`, `crop_name`).
  * `dim_weather`: Menyimpan kombinasi parameter cuaca (`weather_id`, `temperature`, `humidity`).
  * `dim_soil`: Menyimpan parameter kondisi tanah (`soil_id`, `ph`).
* **Tabel Fakta:**
  * `fact_prediction`: Tabel sentral yang menghubungkan ketiga dimensi di atas menggunakan *foreign key* (`crop_id`, `weather_id`, `soil_id`) untuk pencatatan histori data prediksi dan rekomendasi.

### B. Machine Learning Pipeline
Model klasifikasi dibangun menggunakan algoritma **Random Forest** dengan tahapan sebagai berikut:
1. **Data Balancing**: Mengatasi *imbalance class* agar distribusi data tiap jenis tanaman sama rata.
2. **Feature Engineering**: Standardisasi fitur numerik menggunakan Z-score scaling (*StandardScaler*).
3. **Splitting**: Pembagian proporsi data menjadi 80% Training Set dan 20% Test Set.
4. **Model Export**: Hasil pelatihan diekspor ke dalam file berekstensi `.pkl` untuk diintegrasikan ke sisi Web Application:
   * `crop_model.pkl` (Model utama Random Forest)
   * `scaler.pkl` (Objek standardisasi fitur)
   * `label_encoder.pkl` (Objek pemetaan teks ke angka)

---

## 🛠️ Teknologi & Library yang Digunakan
* **Bahasa Pemrograman:** Python 3
* **Analisis & Manipulasi Data:** `pandas`, `numpy`
* **Machine Learning:** `scikit-learn` (RandomForestClassifier, train_test_split, StandardScaler, LabelEncoder)
* **Model Serialization:** `joblib`
* **Platform Eksekusi:** Google Colab / Jupyter Notebook
