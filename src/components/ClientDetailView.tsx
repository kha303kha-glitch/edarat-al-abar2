import React, {useMemo} from 'react';
import {
  ArrowRight,
  ChevronLeft,
  Compass,
  Droplets,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from 'lucide-react';
import type {Client, PreDrillingPoint, Well, WellAction} from '../types/models';
import {
  formatMoney,
  formatNumber,
  getClientSummaryStats,
  getWellSummaryStats,
} from '../utils/format';

interface ClientDetailViewProps {
  client: Client;
  wells: Well[];
  actions: WellAction[];
  surveyPoints: PreDrillingPoint[];
  onBack: () => void;
  onEditClient: () => void;
  onDeleteClient: () => void;
  onAddWell: () => void;
  onSelectWell: (wellId: string) => void;
  onOpenSurveyPoints: () => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  wells,
  actions,
  surveyPoints,
  onBack,
  onEditClient,
  onDeleteClient,
  onAddWell,
  onSelectWell,
  onOpenSurveyPoints,
}) => {
  const clientStats = useMemo(() => getClientSummaryStats(wells, actions), [wells, actions]);

  const wellsWithStats = useMemo(() => {
    return [...wells]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((well) => {
        const wellActions = actions.filter((a) => a.wellId === well.id);
        return {
          well,
          stats: getWellSummaryStats(well, wellActions),
        };
      });
  }, [wells, actions]);

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb Back */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#0F3D6E] hover:bg-sky-50 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          <span>العودة إلى قائمة العملاء</span>
        </button>
      </div>

      {/* Client Details Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-slate-900">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <a
                href={`tel:${client.phone}`}
                className="inline-flex items-center gap-1.5 font-mono tabular-nums text-[#0F3D6E] hover:underline"
              >
                <Phone className="h-4 w-4" />
                <span dir="ltr">{client.phone}</span>
              </a>
              {client.address && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{client.address}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onEditClient}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap"
            >
              <Pencil className="h-4 w-4" />
              <span>تعديل</span>
            </button>
            <button
              type="button"
              onClick={onDeleteClient}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors whitespace-nowrap"
            >
              <Trash2 className="h-4 w-4" />
              <span>حذف</span>
            </button>
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div>
            <span className="block text-xs text-slate-500">إجمالي الأعمال</span>
            <span className="font-mono tabular-nums text-lg font-bold text-slate-900">
              {formatMoney(clientStats.totalAmount)}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">المدفوع</span>
            <span className="font-mono tabular-nums text-lg font-bold text-emerald-700">
              {formatMoney(clientStats.paidAmount)}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">المتبقي الكلي</span>
            <span
              className={`font-mono tabular-nums text-lg font-bold ${
                clientStats.totalRemaining > 0 ? 'text-red-700' : 'text-emerald-700'
              }`}
            >
              {formatMoney(clientStats.totalRemaining)}
            </span>
          </div>
        </div>

        {/* Primary Client Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onAddWell}
            className="min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F3D6E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2E54] transition-colors whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة بئر جديد</span>
          </button>

          <button
            type="button"
            onClick={onOpenSurveyPoints}
            className="min-h-[48px] flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#0F3D6E]/30 bg-sky-50/70 px-5 py-2.5 text-sm font-semibold text-[#0F3D6E] hover:bg-sky-100/80 transition-colors whitespace-nowrap"
          >
            <Compass className="h-4 w-4" />
            <span>
              نقاط ما قبل الحفر ({formatNumber(surveyPoints.length)}/10)
            </span>
          </button>
        </div>
      </section>

      {/* Wells List */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">
            الآبار التابعة للعميل ({formatNumber(wells.length)})
          </h2>
        </div>

        {wellsWithStats.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#0F3D6E]">
              <Droplets className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              لا توجد آبار مسجلة لهذا العميل بعد.
            </p>
            <button
              type="button"
              onClick={onAddWell}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#0F3D6E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0B2E54]"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة بئر جديد</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wellsWithStats.map(({well, stats}) => (
              <button
                key={well.id}
                type="button"
                onClick={() => onSelectWell(well.id)}
                className="group text-right rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#0F3D6E]/50 hover:shadow-md transition-all flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-display text-lg font-bold text-slate-900 truncate group-hover:text-[#0F3D6E] transition-colors">
                      {well.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {well.type === 'new' ? 'بئر جديد (حفر جديد)' : 'بئر قديم (صيانة / تطوير)'}
                      <span className="mx-1.5 text-slate-300" aria-hidden="true">·</span>
                      {formatNumber(stats.actionCount)} {stats.actionCount === 1 ? 'إجراء' : 'إجراءات'}
                    </p>
                  </div>
                  <ChevronLeft className="h-5 w-5 text-slate-300 group-hover:text-[#0F3D6E] shrink-0 mt-1" />
                </div>

                <div className="flex items-end justify-between gap-4 pt-3 border-t border-slate-100 w-full">
                  <div>
                    <span className="block text-[11px] text-slate-500">عمق البئر</span>
                    <span className="font-mono tabular-nums text-base font-bold text-slate-900">
                      {formatNumber(stats.currentDepth)} م
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="block text-[11px] text-slate-500">المتبقي المالي</span>
                    <span
                      className={`font-mono tabular-nums text-base font-bold ${
                        stats.remainingAmount > 0 ? 'text-red-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatMoney(stats.remainingAmount)}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
