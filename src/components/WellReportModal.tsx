import React from 'react';
import {Capacitor} from '@capacitor/core';
import {Directory, Encoding, Filesystem} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {Download, Printer, X} from 'lucide-react';
import type {Client, Well, WellAction} from '../types/models';
import {
  formatCasingSummary,
  formatDateArabic,
  formatDateTimeArabic,
  formatMoney,
  formatNumber,
  formatSpringsList,
  getActionTitle,
  getWellSummaryStats,
} from '../utils/format';

interface WellReportModalProps {
  open: boolean;
  client: Client;
  well: Well;
  actions: WellAction[]; // sorted newest-first or chronological
  onClose: () => void;
}

export const WellReportModal: React.FC<WellReportModalProps> = ({
  open,
  client,
  well,
  actions,
  onClose,
}) => {
  if (!open) return null;

  const stats = getWellSummaryStats(well, actions);
  const chronological = [...actions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const wellSprings = formatSpringsList(well.springs);

  const handleDownloadHtml = async () => {
    const reportEl = document.getElementById('printable-well-report');
    if (!reportEl) return;
    const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>تقرير البئر - ${well.name}</title>
  <style>
    body { font-family: Tahoma, Arial, sans-serif; color: #0f172a; margin: 24px; line-height: 1.6; }
    h1, h2, h3 { color: #0f3d6e; margin: 0 0 8px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: right; vertical-align: top; }
    th { background: #f1f5f9; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px 12px; background: #f8fafc; }
    .red { color: #b91c1c; font-weight: bold; }
    .green { color: #15803d; font-weight: bold; }
  </style>
</head>
<body>${reportEl.innerHTML}</body>
</html>`;
    const fileName = `well-report-${Date.now()}.html`;
    if (Capacitor.isNativePlatform()) {
      try {
        const cached = await Filesystem.writeFile({
          path: fileName,
          data: html,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
        await Share.share({
          title: `تقرير البئر - ${well.name}`,
          url: cached.uri,
          dialogTitle: 'مشاركة أو حفظ التقرير',
        });
      } catch {
        // Ignore cancellation or write failure
      }
      return;
    }

    const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير-${well.name.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div
        className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-4xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 bg-slate-50">
            <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
              معاينة تقرير البئر (PDF)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-800 hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                <span>حفظ نسخة</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-[#0F3D6E] px-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#0B2E54]"
              >
                <Printer className="h-4 w-4" />
                <span>طباعة / PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto p-5 sm:p-8 bg-white">
            <ReportBody
              id="printable-well-report"
              client={client}
              well={well}
              chronological={chronological}
              stats={stats}
              wellSprings={wellSprings}
            />
          </div>
        </div>
      </div>

      {/* Dedicated print-only copy */}
      <div className="hidden print-only">
        <ReportBody
          client={client}
          well={well}
          chronological={chronological}
          stats={stats}
          wellSprings={wellSprings}
        />
      </div>
    </>
  );
};

interface ReportBodyProps {
  id?: string;
  client: Client;
  well: Well;
  chronological: WellAction[];
  stats: ReturnType<typeof getWellSummaryStats>;
  wellSprings: string[];
}

const ReportBody: React.FC<ReportBodyProps> = ({
  id,
  client,
  well,
  chronological,
  stats,
  wellSprings,
}) => (
  <div id={id} className="space-y-6 text-slate-900">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#0F3D6E] pb-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F3D6E]">
          تقرير بئر: {well.name}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          العميل: <strong className="text-slate-900">{client.name}</strong> · هاتف:{' '}
          <span className="font-mono tabular-nums">{client.phone}</span>
          {client.address ? ` · ${client.address}` : ''}
        </p>
      </div>
      <div className="text-xs text-slate-500 text-left">
        <div>تاريخ التقرير: {formatDateTimeArabic(new Date().toISOString())}</div>
        <div>نوع البئر: {well.type === 'new' ? 'بئر جديد (حفر جديد)' : 'بئر قديم (صيانة/تطوير)'}</div>
      </div>
    </div>

    {/* Well Specifications */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <span className="block text-xs text-slate-500">العمق الإجمالي الحالي</span>
        <strong className="font-mono tabular-nums text-base text-slate-900">
          {formatNumber(stats.currentDepth)} م
        </strong>
      </div>
      {well.type === 'new' ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-xs text-slate-500">قطر البئر المطلوب</span>
            <strong className="font-mono tabular-nums text-base text-slate-900">
              {well.diameter !== undefined ? `${formatNumber(well.diameter)} بوصة` : '—'}
            </strong>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-xs text-slate-500">تاريخ بدء العمل</span>
            <strong className="text-sm text-slate-900">
              {well.workStartDate ? formatDateArabic(well.workStartDate) : '—'}
            </strong>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-xs text-slate-500">العمق قبل البدء</span>
            <strong className="font-mono tabular-nums text-base text-slate-900">
              {well.initialDepth !== undefined ? `${formatNumber(well.initialDepth)} م` : '—'}
            </strong>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <span className="block text-xs text-slate-500">الحالة الأولية</span>
            <strong className="text-xs text-slate-800">{well.initialCondition || '—'}</strong>
          </div>
        </>
      )}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <span className="block text-xs text-slate-500">الإكساء الأولي</span>
        <strong className="text-xs text-slate-900">{formatCasingSummary(well.casing)}</strong>
      </div>
    </div>

    {(well.location || wellSprings.length > 0) && (
      <div className="text-xs text-slate-700 space-y-1">
        {well.location && (
          <div>
            الإحداثيات الجغرافية:{' '}
            <span className="font-mono tabular-nums" dir="ltr">
              {well.location.lat}, {well.location.lng}
            </span>
          </div>
        )}
        {wellSprings.length > 0 && <div>النبوع الأولية: {wellSprings.join(' · ')}</div>}
      </div>
    )}

    {/* Financial Totals */}
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-slate-200 p-3.5">
        <span className="block text-xs text-slate-500">إجمالي تكلفة الأعمال</span>
        <span className="font-mono tabular-nums text-lg font-bold text-slate-900">
          {formatMoney(stats.totalAmount)}
        </span>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
        <span className="block text-xs text-emerald-700">إجمالي المدفوع</span>
        <span className="font-mono tabular-nums text-lg font-bold text-emerald-700">
          {formatMoney(stats.paidAmount)}
        </span>
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50/40 p-3.5">
        <span className="block text-xs text-red-700">المتبقي</span>
        <span
          className={`font-mono tabular-nums text-lg font-bold ${
            stats.remainingAmount > 0 ? 'text-red-700' : 'text-emerald-700'
          }`}
        >
          {formatMoney(stats.remainingAmount)}
        </span>
      </div>
    </div>

    {/* Actions Table */}
    <div>
      <h2 className="font-display text-base font-bold text-slate-900 mb-2">
        سجل الإجراءات ({chronological.length})
      </h2>
      {chronological.length === 0 ? (
        <p className="text-sm text-slate-500">لا توجد إجراءات مسجلة لهذا البئر حتى الآن.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 text-slate-800">
                <th className="border border-slate-300 px-2.5 py-2 text-right">#</th>
                <th className="border border-slate-300 px-2.5 py-2 text-right">التاريخ</th>
                <th className="border border-slate-300 px-2.5 py-2 text-right">الإجراء والتفاصيل</th>
                <th className="border border-slate-300 px-2.5 py-2 text-right">الأمتار × السعر</th>
                <th className="border border-slate-300 px-2.5 py-2 text-right">الإجمالي</th>
                <th className="border border-slate-300 px-2.5 py-2 text-right">المدفوع</th>
                <th className="border border-slate-300 px-2.5 py-2 text-right">المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {chronological.map((act, idx) => {
                const actionSprings = formatSpringsList(act.springs);
                return (
                  <tr key={act.id} className="align-top">
                    <td className="border border-slate-300 px-2.5 py-2 font-mono tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 whitespace-nowrap">
                      <div>{formatDateTimeArabic(act.createdAt)}</div>
                      {act.updatedAt && (
                        <div className="text-[11px] text-slate-500">
                          محدّث: {formatDateTimeArabic(act.updatedAt)}
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 space-y-1">
                      <div className="font-semibold text-slate-900">{getActionTitle(act)}</div>
                      {act.casing.type !== 'none' && (
                        <div className="text-xs text-slate-600">
                          {formatCasingSummary(act.casing)}
                        </div>
                      )}
                      {actionSprings.length > 0 && (
                        <div className="text-xs text-slate-600">{actionSprings.join(' · ')}</div>
                      )}
                      {act.otherActionsDesc && (
                        <div className="text-xs text-slate-600">
                          أعمال إضافية: {act.otherActionsDesc} ({formatMoney(act.otherActionsCost)})
                        </div>
                      )}
                      {act.notes && <div className="text-xs text-slate-500">{act.notes}</div>}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 font-mono tabular-nums whitespace-nowrap">
                      {formatNumber(act.drillingMeters)} م × {formatMoney(act.pricePerMeter)}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 font-mono tabular-nums font-semibold">
                      {formatMoney(act.totalAmount)}
                    </td>
                    <td className="border border-slate-300 px-2.5 py-2 font-mono tabular-nums font-semibold text-emerald-700">
                      {formatMoney(act.paidAmount)}
                    </td>
                    <td
                      className={`border border-slate-300 px-2.5 py-2 font-mono tabular-nums font-bold ${
                        act.remainingAmount > 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatMoney(act.remainingAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);
