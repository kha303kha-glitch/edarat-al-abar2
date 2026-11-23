import React, {useMemo, useState} from 'react';
import {
  ArrowRight,
  ExternalLink,
  FileText,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
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

interface WellDetailViewProps {
  client: Client;
  well: Well;
  actions: WellAction[];
  onBackToClient: () => void;
  onEditWell: () => void;
  onDeleteWell: () => void;
  onAddAction: () => void;
  onEditAction: (action: WellAction) => void;
  onDeleteAction: (action: WellAction) => void;
  onOpenReport: () => void;
}

export const WellDetailView: React.FC<WellDetailViewProps> = ({
  client,
  well,
  actions,
  onBackToClient,
  onEditWell,
  onDeleteWell,
  onAddAction,
  onEditAction,
  onDeleteAction,
  onOpenReport,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const stats = useMemo(() => getWellSummaryStats(well, actions), [well, actions]);

  // Compute chronological sequence numbers (#1 = oldest), while displaying newest-first
  const actionsNewestFirst = useMemo(() => {
    const sortedAsc = [...actions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const seqMap = new Map<string, number>();
    sortedAsc.forEach((a, idx) => seqMap.set(a.id, idx + 1));

    return [...sortedAsc].reverse().map((act) => ({
      action: act,
      sequenceNumber: seqMap.get(act.id) ?? 1,
    }));
  }, [actions]);

  const initialSprings = formatSpringsList(well.springs);

  return (
    <div className="space-y-6 pb-20 sm:pb-12">
      {/* Top Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToClient}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#0F3D6E] hover:bg-sky-50 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة إلى العميل: {client.name}</span>
        </button>

        <button
          type="button"
          onClick={onOpenReport}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap"
        >
          <FileText className="h-4 w-4 text-[#0F3D6E]" />
          <span>تقرير PDF</span>
        </button>
      </div>

      {/* Well Core Information Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold text-slate-900">{well.name}</h1>
            <p className="text-sm text-slate-500">
              {well.type === 'new' ? 'بئر جديد (حفر جديد)' : 'بئر قديم (صيانة / تطوير)'}
              <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
              العمق الحالي:{' '}
              <strong className="font-mono tabular-nums text-slate-900">
                {formatNumber(stats.currentDepth)} م
              </strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onEditWell}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              <span>تعديل</span>
            </button>
            <button
              type="button"
              onClick={onDeleteWell}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>حذف</span>
            </button>
          </div>
        </div>

        {/* Technical Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-sm">
          {well.type === 'new' ? (
            <>
              <div>
                <span className="block text-xs text-slate-500">قطر البئر المطلوب</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {well.diameter !== undefined ? `${formatNumber(well.diameter)} بوصة` : '—'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">تاريخ بدء العمل</span>
                <span className="font-semibold text-slate-900">
                  {well.workStartDate ? formatDateArabic(well.workStartDate) : '—'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="block text-xs text-slate-500">العمق قبل البدء</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {well.initialDepth !== undefined ? `${formatNumber(well.initialDepth)} م` : '—'}
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-500">الحالة قبل العمل</span>
                <span className="font-medium text-slate-800">
                  {well.initialCondition || '—'}
                </span>
              </div>
            </>
          )}

          <div>
            <span className="block text-xs text-slate-500">الإكساء</span>
            <span className="font-medium text-slate-900">{formatCasingSummary(well.casing)}</span>
          </div>

          <div>
            <span className="block text-xs text-slate-500">الموقع الجغرافي</span>
            {well.location ? (
              <a
                href={`https://maps.google.com/?q=${well.location.lat},${well.location.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-xs text-[#0F3D6E] hover:underline mt-0.5"
                dir="ltr"
              >
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>
                  {well.location.lat}, {well.location.lng}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            ) : (
              <span className="text-slate-500">غير محدد</span>
            )}
          </div>
        </div>

        {initialSprings.length > 0 && (
          <div className="text-xs text-slate-600 pt-1">
            <span className="font-semibold text-slate-800">معلومات النبوع الأولية: </span>
            {initialSprings.join(' · ')}
          </div>
        )}

        {/* Financial Summary for this Well */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div>
            <span className="block text-xs text-slate-500">إجمالي البئر</span>
            <span className="font-mono tabular-nums text-lg font-bold text-slate-900">
              {formatMoney(stats.totalAmount)}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">المدفوع</span>
            <span className="font-mono tabular-nums text-lg font-bold text-emerald-700">
              {formatMoney(stats.paidAmount)}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">المتبقي من البئر</span>
            <span
              className={`font-mono tabular-nums text-lg font-bold ${
                stats.remainingAmount > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {formatMoney(stats.remainingAmount)}
            </span>
          </div>
        </div>
      </section>

      {/* Actions Section */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              سجل الإجراءات ({formatNumber(actions.length)})
            </h2>
            <p className="text-xs text-slate-500">مرتبة من الأحدث إلى الأقدم</p>
          </div>

          <button
            type="button"
            onClick={onAddAction}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#0F3D6E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2E54] transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة إجراء جديد</span>
          </button>
        </div>

        {actionsNewestFirst.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
            <p className="text-sm font-medium text-slate-700">
              لا توجد إجراءات مسجلة لهذا البئر بعد. يبدأ الرصيد المتبقي من 0 ويتحدث تلقائياً عند إضافة أي إجراء.
            </p>
            <button
              type="button"
              onClick={onAddAction}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#0F3D6E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0B2E54]"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة أول إجراء</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {actionsNewestFirst.map(({action, sequenceNumber}) => {
              const actionSprings = formatSpringsList(action.springs);
              return (
                <article
                  key={action.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#0F3D6E]">
                          #{sequenceNumber}
                        </span>
                        <h3 className="font-display text-lg font-bold text-slate-900">
                          {getActionTitle(action)}
                        </h3>
                      </div>
                      <div className="text-xs text-slate-500">
                        <span>{formatDateTimeArabic(action.createdAt)}</span>
                        {action.updatedAt && (
                          <>
                            <span className="mx-1.5 text-slate-300" aria-hidden="true">·</span>
                            <span>آخر تحديث: {formatDateTimeArabic(action.updatedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditAction(action)}
                        aria-label="تعديل الإجراء"
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAction(action)}
                        aria-label="حذف الإجراء"
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Technical Metadata */}
                  {(action.drillingMeters > 0 ||
                    action.casing.type !== 'none' ||
                    actionSprings.length > 0 ||
                    action.otherActionsDesc) && (
                    <div className="text-xs sm:text-sm text-slate-700 space-y-1.5 pt-2 border-t border-slate-100">
                      {action.drillingMeters > 0 && (
                        <div>
                          الحفر:{' '}
                          <span className="font-mono tabular-nums font-semibold">
                            {formatNumber(action.drillingMeters)} م × {formatMoney(action.pricePerMeter)}
                          </span>
                        </div>
                      )}
                      {action.casing.type !== 'none' && (
                        <div>{formatCasingSummary(action.casing)}</div>
                      )}
                      {actionSprings.length > 0 && (
                        <div>النبوع: {actionSprings.join(' · ')}</div>
                      )}
                      {action.otherActionsDesc && (
                        <div>
                          إجراءات أخرى: {action.otherActionsDesc} (
                          <span className="font-mono tabular-nums">
                            {formatMoney(action.otherActionsCost)}
                          </span>
                          )
                        </div>
                      )}
                    </div>
                  )}

                  {action.notes && (
                    <p className="text-sm leading-relaxed text-slate-600 bg-slate-50 rounded-xl p-3">
                      {action.notes}
                    </p>
                  )}

                  {action.attachments && action.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {action.attachments.map((att) => (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => setPreviewImage(att.dataUrl)}
                          className="h-16 w-16 rounded-lg overflow-hidden border border-slate-200 hover:opacity-90"
                        >
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Financial Triplet */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                    <div>
                      <span className="block text-[11px] text-slate-500">الإجمالي المالي</span>
                      <span className="font-mono tabular-nums text-base font-bold text-slate-900">
                        {formatMoney(action.totalAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">المدفوع</span>
                      <span className="font-mono tabular-nums text-base font-bold text-emerald-700">
                        {formatMoney(action.paidAmount)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] text-slate-500">المتبقي</span>
                      <span
                        className={`font-mono tabular-nums text-base font-bold ${
                          action.remainingAmount > 0 ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {formatMoney(action.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            aria-label="إغلاق المعاينة"
            className="absolute top-4 left-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewImage}
            alt="مرفق الإجراء"
            referrerPolicy="no-referrer"
            className="max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  );
};
