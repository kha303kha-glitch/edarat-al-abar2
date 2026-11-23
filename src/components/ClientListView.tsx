import React, {useMemo, useState} from 'react';
import {ChevronLeft, Phone, Plus, Search, Users} from 'lucide-react';
import type {Client, Well, WellAction} from '../types/models';
import {
  formatMoney,
  formatNumber,
  getClientSummaryStats,
  toLatinDigits,
} from '../utils/format';

interface ClientListViewProps {
  clients: Client[];
  wells: Well[];
  actions: WellAction[];
  onSelectClient: (clientId: string) => void;
  onAddClient: () => void;
}

type SortOption = 'newest' | 'remaining_desc' | 'name';

export const ClientListView: React.FC<ClientListViewProps> = ({
  clients,
  wells,
  actions,
  onSelectClient,
  onAddClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const clientsWithStats = useMemo(() => {
    const normalizedQuery = toLatinDigits(searchQuery.trim().toLowerCase());

    const enriched = clients.map((client) => {
      const clientWells = wells.filter((w) => w.clientId === client.id);
      const clientActions = actions.filter((a) => a.clientId === client.id);
      const stats = getClientSummaryStats(clientWells, clientActions);
      return {client, stats};
    });

    const filtered = normalizedQuery
      ? enriched.filter(({client}) => {
          const nameMatch = client.name.toLowerCase().includes(normalizedQuery);
          const phoneMatch = toLatinDigits(client.phone).includes(normalizedQuery);
          const addressMatch = client.address?.toLowerCase().includes(normalizedQuery) ?? false;
          return nameMatch || phoneMatch || addressMatch;
        })
      : enriched;

    return filtered.sort((a, b) => {
      if (sortBy === 'remaining_desc') {
        return b.stats.totalRemaining - a.stats.totalRemaining;
      }
      if (sortBy === 'name') {
        return a.client.name.localeCompare(b.client.name, 'ar');
      }
      return new Date(b.client.createdAt).getTime() - new Date(a.client.createdAt).getTime();
    });
  }, [clients, wells, actions, searchQuery, sortBy]);

  const globalSummary = useMemo(() => {
    let totalRemaining = 0;
    let totalPaid = 0;
    for (const act of actions) {
      totalRemaining += act.remainingAmount || 0;
      totalPaid += act.paidAmount || 0;
    }
    return {
      clientCount: clients.length,
      wellCount: wells.length,
      totalRemaining,
      totalPaid,
    };
  }, [clients.length, wells.length, actions]);

  return (
    <div className="space-y-6 pb-24 sm:pb-10">
      {/* Top Overview & Search Controls */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">العملاء</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              إجمالي العملاء: <span className="font-mono tabular-nums font-semibold text-slate-700">{formatNumber(globalSummary.clientCount)}</span>
              <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
              إجمالي الآبار: <span className="font-mono tabular-nums font-semibold text-slate-700">{formatNumber(globalSummary.wellCount)}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <span className="block text-xs text-slate-500">إجمالي المدفوع</span>
              <span className="font-mono tabular-nums text-lg font-bold text-emerald-700">
                {formatMoney(globalSummary.totalPaid)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" aria-hidden="true" />
            <div>
              <span className="block text-xs text-slate-500">المتبقي الكلي للعملاء</span>
              <span
                className={`font-mono tabular-nums text-lg font-bold ${
                  globalSummary.totalRemaining > 0 ? 'text-red-700' : 'text-emerald-700'
                }`}
              >
                {formatMoney(globalSummary.totalRemaining)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم العميل أو رقم الهاتف..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-slate-50/50 pr-10 pl-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F3D6E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <select
            aria-label="ترتيب العملاء"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="min-h-[44px] sm:w-48 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
          >
            <option value="newest">الأحدث إضافة</option>
            <option value="remaining_desc">الأعلى متبقياً</option>
            <option value="name">ترتيب أبجدي</option>
          </select>
        </div>
      </section>

      {/* Clients Grid */}
      {clients.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-[#0F3D6E]">
            <Users className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h2 className="font-display text-lg font-bold text-slate-900">
              لا يوجد عملاء مسجلون بعد
            </h2>
            <p className="text-sm text-slate-500">
              ابدأ بإضافة أول عميل لتسجيل آباره، تتبع أعمال الحفر والصيانة، وإدارة الحسابات المالية ميدانياً دون اتصال بالإنترنت.
            </p>
          </div>
          <button
            type="button"
            onClick={onAddClient}
            className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#0F3D6E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#0B2E54] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة أول عميل</span>
          </button>
        </div>
      ) : clientsWithStats.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-2">
          <p className="text-base font-semibold text-slate-800">لا توجد نتائج مطابقة للبحث</p>
          <p className="text-sm text-slate-500">جرّب البحث باسم آخر أو رقم هاتف مختلف.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientsWithStats.map(({client, stats}) => (
            <button
              key={client.id}
              type="button"
              onClick={() => onSelectClient(client.id)}
              className="group text-right rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 hover:border-[#0F3D6E]/50 hover:shadow-md transition-all flex flex-col justify-between gap-4 min-h-[124px]"
            >
              <div className="flex items-start justify-between gap-3 w-full">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-display text-lg font-bold text-slate-900 truncate group-hover:text-[#0F3D6E] transition-colors">
                    {client.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span dir="ltr">{client.phone}</span>
                  </div>
                  {client.address && (
                    <p className="text-xs text-slate-500 truncate pt-0.5">{client.address}</p>
                  )}
                </div>

                <ChevronLeft className="h-5 w-5 text-slate-300 group-hover:text-[#0F3D6E] shrink-0 mt-1 transition-colors" />
              </div>

              <div className="flex items-end justify-between gap-3 pt-3 border-t border-slate-100 w-full">
                <span className="text-xs text-slate-500">
                  {formatNumber(stats.wellCount)} {stats.wellCount === 1 ? 'بئر' : 'آبار'}
                </span>

                <div className="text-left">
                  <span className="block text-[11px] font-medium text-slate-500">
                    المتبقي الكلي
                  </span>
                  <span
                    className={`font-mono tabular-nums text-base font-bold ${
                      stats.totalRemaining > 0 ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {formatMoney(stats.totalRemaining)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Mobile Floating Action Button (+) */}
      <button
        type="button"
        onClick={onAddClient}
        aria-label="إضافة عميل جديد"
        className="sm:hidden fixed bottom-5 left-5 z-30 h-14 w-14 rounded-2xl bg-[#0F3D6E] text-white shadow-xl shadow-slate-900/25 flex items-center justify-center hover:bg-[#0B2E54] active:scale-95 transition-transform"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
};
