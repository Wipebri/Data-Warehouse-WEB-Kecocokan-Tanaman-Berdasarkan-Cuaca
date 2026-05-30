export type PageKey = 'beranda' | 'analisis-tanaman' | 'cuaca' | 'historis' | 'laporan' | 'login' | 'register' | 'admin' | 'admin-dw';

export interface BIFilter {
  days: number
  crops: string[]
  location: string
}

export interface DrillDownRow {
  id: number
  date: string
  cropLabel: string
  location: string
  score: number
  label: string
  temp: number
  hum: number
  water: number
  heatStress: number
  diseaseRisk: number
  createdAt: string
  userName: string
}
