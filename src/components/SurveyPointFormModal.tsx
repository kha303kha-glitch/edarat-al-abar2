import React, {useEffect, useState} from 'react';
import {Plus, Save, X} from 'lucide-react';
import type {GeoCoordinates, PreDrillingPoint, SurveySpringEstimate} from '../types/models';
import {generateId, parseDecimalOrUndefined} from '../utils/format';
import {DecimalInput} from './DecimalInput';
import {LocationField} from './LocationField';

interface SurveyPointFormModalProps {
  open: boolean;
  clientId: string;
  pointNumber: number; // Auto-assigned 1..10
  editingPoint?: PreDrillingPoint | null;
  onSave: (point: PreDrillingPoint) => void;
  onClose: () => void;
}

interface SpringRowDraft {
  index: number;
  approxDepth: string;
  approxFlow: string;
}

function buildInitialRows(existing?: SurveySpringEstimate[]): SpringRowDraft[] {
  const rows: SpringRowDraft[] = [];
  const maxIndex = existing && existing.length > 0 ? Math.max(...existing.map((s) => s.index), 1) : 1;
  const count = Math.min(10, Math.max(1, maxIndex));
  for (let i = 1; i <= count; i++) {
    const match = existing?.find((s) => s.index === i);
    rows.push({
      index: i,
      approxDepth: match?.approxDepth !== undefined ? String(match.approxDepth) : '',
      approxFlow: match?.approxFlow !== undefined ? String(match.approxFlow) : '',
    });
  }
  return rows;
}

export const SurveyPointFormModal: React.FC<SurveyPointFormModalProps> = ({
  open,
  clientId,
  pointNumber,
  editingPoint,
  onSave,
  onClose,
}) => {
  const [location, setLocation] = useState<GeoCoordinates | undefined>(undefined);
  const [rows, setRows] = useState<SpringRowDraft[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingPoint) {
      setLocation(editingPoint.location);
      setRows(buildInitialRows(editingPoint.springs));
      setNotes(editingPoint.notes ?? '');
    } else {
      setLocation(undefined);
      setRows(buildInitialRows());
      setNotes('');
    }
  }, [open, editingPoint]);

  if (!open) return null;

  const displayNumber = editingPoint ? editingPoint.pointNumber : pointNumber;

  const handleAddSpringRow = () => {
    if (rows.length >= 10) return;
    setRows((prev) => [
      ...prev,
      {index: prev.length + 1, approxDepth: '', approxFlow: ''},
    ]);
  };

  const handleShowAllTen = () => {
    setRows((prev) => {
      const next = [...prev];
      for (let i = next.length + 1; i <= 10; i++) {
        next.push({index: i, approxDepth: '', approxFlow: ''});
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const springs: SurveySpringEstimate[] = rows
      .map((r) => ({
        index: r.index,
        approxDepth: parseDecimalOrUndefined(r.approxDepth),
        approxFlow: parseDecimalOrUndefined(r.approxFlow),
      }))
      .filter((s) => s.approxDepth !== undefined || s.approxFlow !== undefined);

    const now = new Date().toISOString();
    const record: PreDrillingPoint = {
      id: editingPoint?.id ?? generateId(),
      clientId: editingPoint?.clientId ?? clientId,
      pointNumber: displayNumber,
      location,
      springs,
      notes: notes.trim() || undefined,
      createdAt: editingPoint?.createdAt ?? now,
      updatedAt: editingPoint ? now : undefined,
    };

    onSave(record);
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="survey-point-modal-title"
    >
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <h2 id="survey-point-modal-title" className="font-display text-lg font-bold text-slate-900">
            {editingPoint ? `تعديل نقطة ${displayNumber}` : `إضافة نقطة ${displayNumber}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5">
          <LocationField
            label={`الموقع الجغرافي — نقطة ${displayNumber}`}
            value={location}
            onChange={setLocation}
          />

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  تقديرات النبوع (حتى 10 نبوع)
                </h3>
                <p className="text-xs text-slate-500">
                  العمق التقريبي بالمتر والغزارة التقريبية (لتر في الثانية)
                </p>
              </div>
              {rows.length < 10 && (
                <button
                  type="button"
                  onClick={handleShowAllTen}
                  className="text-xs font-semibold text-[#0F3D6E] hover:underline py-1.5 px-2"
                >
                  عرض جميع النبوع (10)
                </button>
              )}
            </div>

            <div className="space-y-3">
              {rows.map((row, idx) => (
                <div
                  key={row.index}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5"
                >
                  <div className="text-xs font-bold text-[#0F3D6E]">نبع {row.index}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DecimalInput
                      id={`spring-${row.index}-depth`}
                      label={`العمق التقريبي للنبع ${row.index}`}
                      value={row.approxDepth}
                      onChange={(val) =>
                        setRows((prev) =>
                          prev.map((item, i) => (i === idx ? {...item, approxDepth: val} : item))
                        )
                      }
                      unit="متر"
                    />
                    <DecimalInput
                      id={`spring-${row.index}-flow`}
                      label={`الغزارة التقريبية للنبع ${row.index}`}
                      value={row.approxFlow}
                      onChange={(val) =>
                        setRows((prev) =>
                          prev.map((item, i) => (i === idx ? {...item, approxFlow: val} : item))
                        )
                      }
                      unit="لتر/ث"
                    />
                  </div>
                </div>
              ))}
            </div>

            {rows.length < 10 && (
              <button
                type="button"
                onClick={handleAddSpringRow}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-[#0F3D6E] hover:bg-sky-50/60 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة نبع رقم {rows.length + 1} (من 10)</span>
              </button>
            )}
          </div>

          <div>
            <label htmlFor="point-notes" className="block text-sm font-medium text-slate-800 mb-1.5">
              ملاحظات ميدانية (اختياري)
            </label>
            <textarea
              id="point-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات المسح الجيولوجي أو التضاريس..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-5 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="min-h-[44px] inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-[#0F3D6E] text-sm font-semibold text-white hover:bg-[#0B2E54] transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{editingPoint ? 'حفظ التعديلات' : `حفظ نقطة ${displayNumber}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
