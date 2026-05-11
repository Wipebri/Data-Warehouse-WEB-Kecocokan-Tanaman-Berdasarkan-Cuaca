# AgroSense - Smart Farming Intelligence

Proyek ini adalah aplikasi fullstack berbasis React + Express + Node.js yang terintegrasi dengan Machine Learning model untuk analisis pertanian dan prediksi kecocokan tanaman berbasis cuaca real-time dari BMKG.

## 📂 Struktur Folder

```
web/
├── backend/               # Server Node.js/Express, API endpoints
│   ├── index.js           # Entry point Express server
│   ├── routes/            # Route handlers
│   │   └── prediction.js  # API prediksi & data tanaman
│   ├── services/
│   │   ├── ml-service.js  # Bridge ke predict.py (spawn)
│   │   └── bmkg.js        # Fetch data cuaca dari BMKG
│   ├── .env               # Environment variables
│   └── package.json
│
├── frontend/              # Aplikasi React + Vite + Tailwind
│   ├── src/
│   │   ├── App.tsx        # Main app dengan sections
│   │   ├── components/    # Komponen React
│   │   │   ├── Navbar.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── FeatureCards.tsx
│   │   │   ├── AgroInsights.tsx
│   │   │   ├── CropChecker.tsx    # Form cek kecocokan tanaman
│   │   │   ├── CTABanner.tsx
│   │   │   └── Footer.tsx
│   │   └── index.css
│   └── package.json
│
└── data-analysis/         # Data science & ML models
    ├── data/
    │   ├── Crop_recommendation.csv  # Dataset 22 jenis tanaman
    │   └── crop_yield_dataset.csv   # Dataset hasil panen
    ├── models/
    │   ├── crop_model.pkl           # Model ML (klasifikasi)
    │   ├── scaler.pkl               # StandardScaler
    │   └── label_encoder.pkl        # LabelEncoder
    └── predict.py                   # Script prediksi (stdin/stdout)
```

---

## 🧠 Fitur Utama: Crop Suitability Checker

Fitur ini memungkinkan user mengecek apakah suatu tanaman **cocok ditanam** di lokasi tertentu berdasarkan **cuaca real-time dari BMKG**.

### Alur Sistem

```
1. User pilih tanaman (dropdown dari 22 jenis)
2. User pilih lokasi/kota (dropdown)
3. Backend fetch cuaca real-time dari BMKG API gratis
4. Data cuaca + soil default → masuk ke model ML
5. Model prediksi → output "COCOK" / "TIDAK COCOK"
```

### Input Model (Crop Recommendation)

| Fitur | Sumber |
|-------|--------|
| N, P, K | Default dari dataset |
| pH tanah | Default (6.5) |
| Temperature | BMKG API (suhu lokasi real-time) |
| Humidity | BMKG API (kelembaban) |
| Rainfall | BMKG API (curah hujan) |

### API Endpoints Backend

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/health` | Cek status server |
| GET | `/api/crops` | Daftar 22 jenis tanaman dari model |
| GET | `/api/locations` | Daftar kota Indonesia |
| POST | `/api/predict/check` | Prediksi kecocokan {crop, location} |

---

## 🌐 Sumber Data

### BMKG API (Gratis)
Data cuaca real-time per kota di Indonesia dari BMKG.
- Basis URL: `https://data.bmkg.go.id/`
- Data yang diambil: suhu, kelembaban, curah hujan, kondisi cuaca
- Tidak perlu API key

### Data Soil (Default)
N, P, K, dan pH tanah menggunakan nilai rata-rata dari dataset crop recommendation. User juga bisa menginput nilai soil sendiri jika ingin lebih akurat.

---

## 🛠️ Prasyarat

- **Node.js** v18+ & npm
- **Python** 3.8+ (untuk `predict.py`)
- **Library Python:** `pandas`, `scikit-learn`, `joblib`

Install Python dependencies:
```bash
pip install pandas scikit-learn joblib
```

---

## 👨‍💻 Cara Memulai

### 1. Backend
```bash
cd backend
npm install
node index.js
```
Server berjalan di `http://localhost:5000`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
App berjalan di `http://localhost:5173`

### 3. Python ML Service
Test predict.py langsung:
```bash
cd data-analysis
echo '{"N": 90, "P": 42, "K": 43, "temperature": 25, "humidity": 80, "ph": 6.5, "rainfall": 200}' | python predict.py
```

---

## 📊 Dataset

### Crop_recommendation.csv
- 2201 baris, 22 jenis tanaman
- Fitur: N, P, K, temperature, humidity, ph, rainfall
- Tanaman: rice, maize, chickpea, kidneybeans, pigeonpeas, mothbeans, mungbean, blackgram, lentil, pomegranate, banana, mango, grapes, watermelon, muskmelon, apple, orange, papaya, coconut, cotton, jute, coffee

### crop_yield_dataset.csv
- 36521 baris
- Fitur: Date, Crop_Type, Soil_Type, Soil_pH, Temperature, Humidity, Wind_Speed, N, P, K, Crop_Yield, Soil_Quality
