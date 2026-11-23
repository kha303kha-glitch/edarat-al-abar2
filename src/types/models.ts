export type WellType = 'new' | 'old';

export type CasingType = 'none' | 'iron' | 'plastic';

export type ActionType = 'deepening' | 'cleaning' | 'other';

export interface GeoCoordinates {
  lat: number;
  lng: number;
  source?: 'gps' | 'map' | 'manual';
  capturedAt?: string;
}

export interface CasingInfo {
  type: CasingType;
  fromDepth?: number;
  toDepth?: number;
}

export interface SpringsInfo {
  firstDepth?: number;
  secondDepth?: number;
  thirdDepth?: number;
}

export interface ActionAttachment {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Well {
  id: string;
  clientId: string;
  type: WellType;
  name: string;
  location?: GeoCoordinates;
  // For new wells (حفر جديد)
  diameter?: number;
  workStartDate?: string;
  // For old wells (صيانة/تطوير)
  initialDepth?: number;
  initialCondition?: string;
  // Shared sections
  casing: CasingInfo;
  springs: SpringsInfo;
  createdAt: string;
  updatedAt?: string;
}

export interface WellAction {
  id: string;
  wellId: string;
  clientId: string;
  actionType: ActionType;
  customActionTitle?: string;
  casing: CasingInfo;
  springs: SpringsInfo;
  drillingMeters: number;
  pricePerMeter: number;
  otherActionsDesc?: string;
  otherActionsCost: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  notes?: string;
  attachments?: ActionAttachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface SurveySpringEstimate {
  index: number; // 1..10
  approxDepth?: number; // متر
  approxFlow?: number; // لتر/ثانية
}

export interface PreDrillingPoint {
  id: string;
  clientId: string;
  pointNumber: number; // 1..10
  location?: GeoCoordinates;
  springs: SurveySpringEstimate[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BackupPayload {
  app: 'well-management';
  version: 1;
  exportedAt: string;
  clients: Client[];
  wells: Well[];
  actions: WellAction[];
  surveyPoints: PreDrillingPoint[];
}

export interface WellSummaryStats {
  actionCount: number;
  totalDrilledMeters: number;
  currentDepth: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface ClientSummaryStats {
  wellCount: number;
  totalAmount: number;
  paidAmount: number;
  totalRemaining: number;
}
