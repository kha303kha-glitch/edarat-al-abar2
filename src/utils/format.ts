import type {
  ActionType,
  CasingInfo,
  CasingType,
  ClientSummaryStats,
  SpringsInfo,
  Well,
  WellAction,
  WellSummaryStats,
} from '../types/models';

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EASTERN_ARABIC = '۰۱۲۳۴۵۶۷۸۹';

export function toLatinDigits(input: string): string {
  return input
    .split('')
    .map((ch) => {
      const idx1 = ARABIC_INDIC.indexOf(ch);
      if (idx1 !== -1) return String(idx1);
      const idx2 = EASTERN_ARABIC.indexOf(ch);
      if (idx2 !== -1) return String(idx2);
      if (ch === '٫' || ch === ',') return '.';
      return ch;
    })
    .join('');
}

/**
 * Accepts only non-negative decimal numbers (up to 4 decimal places).
 */
export function sanitizeDecimalInput(raw: string): string {
  const normalized = toLatinDigits(raw);
  let result = '';
  let hasDot = false;

  for (const ch of normalized) {
    if (ch >= '0' && ch <= '9') {
      result += ch;
    } else if (ch === '.' && !hasDot) {
      hasDot = true;
      result += result.length === 0 ? '0.' : '.';
    }
  }
  return result;
}

export function parseDecimalOrUndefined(raw: string): number | undefined {
  const trimmed = sanitizeDecimalInput(raw).trim();
  if (!trimmed || trimmed === '.') return undefined;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) return undefined;
  return Math.round(num * 10000) / 10000;
}

export function parseDecimalOrZero(raw: string): number {
  return parseDecimalOrUndefined(raw) ?? 0;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatNumber(value: number | undefined | null, maxDecimals = 2): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(roundMoney(value));
}

export function formatDateTimeArabic(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateArabic(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function getCasingLabel(type: CasingType): string {
  switch (type) {
    case 'iron':
      return 'إكساء حديد';
    case 'plastic':
      return 'إكساء بلاستيك';
    default:
      return 'بلا';
  }
}

export function formatCasingSummary(casing: CasingInfo): string {
  if (casing.type === 'none') return 'بلا إكساء';
  const label = getCasingLabel(casing.type);
  const from = casing.fromDepth !== undefined ? `${formatNumber(casing.fromDepth)} م` : '—';
  const to = casing.toDepth !== undefined ? `${formatNumber(casing.toDepth)} م` : '—';
  return `${label} (من ${from} إلى ${to})`;
}

export function formatSpringsList(springs: SpringsInfo): string[] {
  const list: string[] = [];
  if (springs.firstDepth !== undefined) {
    list.push(`نبع أول: ${formatNumber(springs.firstDepth)} م`);
  }
  if (springs.secondDepth !== undefined) {
    list.push(`نبع ثاني: ${formatNumber(springs.secondDepth)} م`);
  }
  if (springs.thirdDepth !== undefined) {
    list.push(`نبع ثالث: ${formatNumber(springs.thirdDepth)} م`);
  }
  return list;
}

export function getActionTitle(action: Pick<WellAction, 'actionType' | 'customActionTitle'>): string {
  if (action.actionType === 'deepening') return 'تعميق';
  if (action.actionType === 'cleaning') return 'تعزيل';
  return action.customActionTitle?.trim() || 'إجراء آخر';
}

export function getWellSummaryStats(well: Well, wellActions: WellAction[]): WellSummaryStats {
  let totalDrilledMeters = 0;
  let totalAmount = 0;
  let paidAmount = 0;

  for (const act of wellActions) {
    totalDrilledMeters += act.drillingMeters || 0;
    totalAmount += act.totalAmount || 0;
    paidAmount += act.paidAmount || 0;
  }

  const baseDepth = well.type === 'old' ? well.initialDepth || 0 : 0;
  const currentDepth = roundMoney(baseDepth + totalDrilledMeters);
  const roundedTotal = roundMoney(totalAmount);
  const roundedPaid = roundMoney(paidAmount);
  const remainingAmount = roundMoney(roundedTotal - roundedPaid);

  return {
    actionCount: wellActions.length,
    totalDrilledMeters: roundMoney(totalDrilledMeters),
    currentDepth,
    totalAmount: roundedTotal,
    paidAmount: roundedPaid,
    remainingAmount,
  };
}

export function getClientSummaryStats(clientWells: Well[], clientActions: WellAction[]): ClientSummaryStats {
  let totalAmount = 0;
  let paidAmount = 0;

  for (const act of clientActions) {
    totalAmount += act.totalAmount || 0;
    paidAmount += act.paidAmount || 0;
  }

  const roundedTotal = roundMoney(totalAmount);
  const roundedPaid = roundMoney(paidAmount);

  return {
    wellCount: clientWells.length,
    totalAmount: roundedTotal,
    paidAmount: roundedPaid,
    totalRemaining: roundMoney(roundedTotal - roundedPaid),
  };
}
