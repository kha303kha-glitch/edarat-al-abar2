import React, {useMemo} from 'react';
import {
  ArrowRight,
  Compass,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import type {Client, PreDrillingPoint} from '../types/models';
import {formatDateTimeArabic, formatNumber} from '../utils/format';

interface PreDrillingSurveyViewProps {
  client: Client;
  points: PreDrillingPoint[];
  onBack: () => void;
  onAddPoint: () => void;
  onEditPoint: (point: PreDrillingPoint) => void;
  onDeletePoint: (point: PreDrillingPoint) => void;
}

export const PreDrillingSurveyView: React.FC<PreDrillingSurveyViewProps> = ({
  client,
  points,
  onBack,
  onAddPoint,
  onEditPoint,
  onDeletePoint,
}) => {
  const sortedPoints = useMemo(
    () => [...points].sort((a, b) => a.pointNumber - b.pointNumber),
    [points]
  );

  const canAddMore = sortedPoints.length < 10;

  return (
    <div className="space-y-6 pb-16">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#0F3D6E] hover:bg-sky-50 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة إلى العميل: {client.name}</span>
        </button>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-slate-900">
            نقاط ما قبل الحفر
          </h1>
          <p className="text-sm text-slate-500">
            العميل: <strong className="text-slate-800">{client.name}</strong>
            <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
            المسجل: <span className="font-mono tabular-nums font-semibold text-slate-800">{sortedPoints.length} / 10</span> نقاط
          </p>
        </div>

        <button
          type="button"
          onClick={onAddPoint}
          disabled={!canAddMore}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F3D6E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2E54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>{canAddMore ? `إضافة نقطة ${sortedPoints.length + 1}` : 'تم بلوغ الحد الأقصى (10 نقاط)'}</span>
        </button>
      </section>

      {sortedPoints.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-[#0F3D6E]">
            <Compass className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="font-display text-lg font-bold text-slate-900">
              لا توجد نقاط مسح مسجلة بعد
            </h2>
            <p className="text-sm text-slate-500">
              يمكنك تسجيل حتى 10 نقاط استكشافية قبل الحفر مع إحداثيات الموقع وتقديرات الأعماق والغزارة لما يصل إلى 10 نبوع لكل نقطة.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddPoint}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#0F3D6E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2E54]"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة نقطة 1</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedPoints.map((point) => (
            <article
              key={point.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-display text-lg font-bold text-[#0F3D6E]">
                    نقطة {point.pointNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {formatDateTimeArabic(point.createdAt)}
                    {point.updatedAt && ` · محدّث: ${formatDateTimeArabic(point.updatedAt)}`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditPoint(point)}
                    aria-label={`تعديل نقطة ${point.pointNumber}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePoint(point)}
                    aria-label={`حذف نقطة ${point.pointNumber}`}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {point.location ? (
                <a
                  href={`https://maps.google.com/?q=${point.location.lat},${point.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-mono tabular-nums text-[#0F3D6E] hover:underline"
                  dir="ltr"
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    {point.location.lat}, {point.location.lng}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <p className="text-xs text-slate-400">لم تُحدد الإحداثيات الجغرافية</p>
              )}

              {point.springs.length > 0 ? (
                <div className="overflow-x-auto border-t border-slate-100 pt-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-100">
                        <th className="py-1.5 text-right font-medium">النبع</th>
                        <th className="py-1.5 text-right font-medium">العمق التقريبي</th>
                        <th className="py-1.5 text-right font-medium">الغزارة التقريبية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {point.springs.map((sp) => (
                        <tr key={sp.index}>
                          <td className="py-1.5 font-semibold text-slate-800">نبع {sp.index}</td>
                          <td className="py-1.5 font-mono tabular-nums text-slate-700">
                            {sp.approxDepth !== undefined ? `${formatNumber(sp.approxDepth)} م` : '—'}
                          </td>
                          <td className="py-1.5 font-mono tabular-nums text-slate-700">
                            {sp.approxFlow !== undefined ? `${formatNumber(sp.approxFlow)} لتر/ث` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                  لا توجد تقديرات نبوع مسجلة لهذه النقطة
                </p>
              )}

              {point.notes && (
                <p className="text-xs leading-relaxed text-slate-600 bg-slate-50 rounded-xl p-3">
                  {point.notes}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
