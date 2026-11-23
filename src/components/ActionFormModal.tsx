import React, {useEffect, useMemo, useState} from 'react';
import {ImagePlus, Save, Trash2, X} from 'lucide-react';
import type {ActionAttachment, ActionType, WellAction} from '../types/models';
import {
  formatMoney,
  generateId,
  parseDecimalOrUndefined,
  parseDecimalOrZero,
  roundMoney,
} from '../utils/format';
import {CasingFields, type CasingFormState} from './CasingFields';
import {DecimalInput} from './DecimalInput';
import {SpringsFields, type SpringsFormState} from './SpringsFields';

interface ActionFormModalProps {
  open: boolean;
  wellId: string;
  clientId: string;
  editingAction?: WellAction | null;
  onSave: (action: WellAction) => void;
  onClose: () => void;
}

export const ActionFormModal: React.FC<ActionFormModalProps> = ({
  open,
  wellId,
  clientId,
  editingAction,
  onSave,
  onClose,
}) => {
  const [actionType, setActionType] = useState<ActionType>('deepening');
  const [customActionTitle, setCustomActionTitle] = useState('');
  const [customTitleError, setCustomTitleError] = useState<string | undefined>(undefined);

  const [casing, setCasing] = useState<CasingFormState>({
    type: 'none',
    fromDepth: '',
    toDepth: '',
  });
  const [springs, setSprings] = useState<SpringsFormState>({
    firstDepth: '',
    secondDepth: '',
    thirdDepth: '',
  });

  // Financials
  const [drillingMeters, setDrillingMeters] = useState('');
  const [pricePerMeter, setPricePerMeter] = useState('');
  const [otherActionsDesc, setOtherActionsDesc] = useState('');
  const [otherActionsCost, setOtherActionsCost] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<ActionAttachment[]>([]);

  useEffect(() => {
    if (!open) return;
    if (editingAction) {
      setActionType(editingAction.actionType);
      setCustomActionTitle(editingAction.customActionTitle ?? '');
      setCasing({
        type: editingAction.casing.type,
        fromDepth:
          editingAction.casing.fromDepth !== undefined
            ? String(editingAction.casing.fromDepth)
            : '',
        toDepth:
          editingAction.casing.toDepth !== undefined ? String(editingAction.casing.toDepth) : '',
      });
      setSprings({
        firstDepth:
          editingAction.springs.firstDepth !== undefined
            ? String(editingAction.springs.firstDepth)
            : '',
        secondDepth:
          editingAction.springs.secondDepth !== undefined
            ? String(editingAction.springs.secondDepth)
            : '',
        thirdDepth:
          editingAction.springs.thirdDepth !== undefined
            ? String(editingAction.springs.thirdDepth)
            : '',
      });
      setDrillingMeters(
        editingAction.drillingMeters ? String(editingAction.drillingMeters) : ''
      );
      setPricePerMeter(editingAction.pricePerMeter ? String(editingAction.pricePerMeter) : '');
      setOtherActionsDesc(editingAction.otherActionsDesc ?? '');
      setOtherActionsCost(
        editingAction.otherActionsCost ? String(editingAction.otherActionsCost) : ''
      );
      setPaidAmount(editingAction.paidAmount ? String(editingAction.paidAmount) : '');
      setNotes(editingAction.notes ?? '');
      setAttachments(editingAction.attachments ?? []);
    } else {
      setActionType('deepening');
      setCustomActionTitle('');
      setCasing({type: 'none', fromDepth: '', toDepth: ''});
      setSprings({firstDepth: '', secondDepth: '', thirdDepth: ''});
      setDrillingMeters('');
      setPricePerMeter('');
      setOtherActionsDesc('');
      setOtherActionsCost('');
      setPaidAmount('');
      setNotes('');
      setAttachments([]);
    }
    setCustomTitleError(undefined);
  }, [open, editingAction]);

  const {totalAmount, remainingAmount} = useMemo(() => {
    const meters = parseDecimalOrZero(drillingMeters);
    const meterPrice = parseDecimalOrZero(pricePerMeter);
    const otherCost = parseDecimalOrZero(otherActionsCost);
    const paid = parseDecimalOrZero(paidAmount);

    const total = roundMoney(meters * meterPrice + otherCost);
    const remaining = roundMoney(total - paid);
    return {totalAmount: total, remainingAmount: remaining};
  }, [drillingMeters, pricePerMeter, otherActionsCost, paidAmount]);

  if (!open) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const item: ActionAttachment = {
            id: generateId(),
            name: file.name,
            mimeType: file.type,
            dataUrl: reader.result,
            createdAt: new Date().toISOString(),
          };
          setAttachments((prev) => [...prev, item]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === 'other' && !customActionTitle.trim()) {
      setCustomTitleError('يرجى كتابة وصف الإجراء الآخر');
      return;
    }

    const now = new Date().toISOString();
    const meters = parseDecimalOrZero(drillingMeters);
    const meterPrice = parseDecimalOrZero(pricePerMeter);
    const otherCost = parseDecimalOrZero(otherActionsCost);
    const paid = parseDecimalOrZero(paidAmount);
    const total = roundMoney(meters * meterPrice + otherCost);
    const remaining = roundMoney(total - paid);

    const record: WellAction = {
      id: editingAction?.id ?? generateId(),
      wellId: editingAction?.wellId ?? wellId,
      clientId: editingAction?.clientId ?? clientId,
      actionType,
      customActionTitle: actionType === 'other' ? customActionTitle.trim() : undefined,
      casing: {
        type: casing.type,
        fromDepth: casing.type === 'none' ? undefined : parseDecimalOrUndefined(casing.fromDepth),
        toDepth: casing.type === 'none' ? undefined : parseDecimalOrUndefined(casing.toDepth),
      },
      springs: {
        firstDepth: parseDecimalOrUndefined(springs.firstDepth),
        secondDepth: parseDecimalOrUndefined(springs.secondDepth),
        thirdDepth: parseDecimalOrUndefined(springs.thirdDepth),
      },
      drillingMeters: meters,
      pricePerMeter: meterPrice,
      otherActionsDesc: otherActionsDesc.trim() || undefined,
      otherActionsCost: otherCost,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      notes: notes.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      // Preserve original creation timestamp when editing
      createdAt: editingAction?.createdAt ?? now,
      updatedAt: editingAction ? now : undefined,
    };

    onSave(record);
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-modal-title"
    >
      <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
          <div>
            <h2 id="action-modal-title" className="font-display text-lg font-bold text-slate-900">
              {editingAction ? 'تعديل بيانات الإجراء' : 'إضافة إجراء جديد'}
            </h2>
            {editingAction && (
              <p className="text-xs text-slate-500 mt-0.5">
                يحتفظ الإجراء بتاريخه الأصلي مع تسجيل تاريخ آخر تحديث
              </p>
            )}
          </div>
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
          {/* Execution Section */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold text-[#0F3D6E]">أولاً: التنفيذ</h3>

            <div>
              <label
                htmlFor="action-type"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                نوع الإجراء
              </label>
              <select
                id="action-type"
                value={actionType}
                onChange={(e) => {
                  setActionType(e.target.value as ActionType);
                  setCustomTitleError(undefined);
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
              >
                <option value="deepening">تعميق</option>
                <option value="cleaning">تعزيل</option>
                <option value="other">إجراء آخر</option>
              </select>
            </div>

            {actionType === 'other' && (
              <div>
                <label
                  htmlFor="custom-action-title"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  وصف الإجراء <span className="text-red-600">*</span>
                </label>
                <input
                  id="custom-action-title"
                  type="text"
                  value={customActionTitle}
                  onChange={(e) => {
                    setCustomActionTitle(e.target.value);
                    if (customTitleError) setCustomTitleError(undefined);
                  }}
                  placeholder="مثال: تركيب مضخة، صيانة تغليف، اختبار ضخ..."
                  className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    customTitleError
                      ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                      : 'border-slate-300 focus:border-[#0F3D6E] focus:ring-sky-100'
                  }`}
                />
                {customTitleError && (
                  <p className="mt-1 text-xs text-red-600">{customTitleError}</p>
                )}
              </div>
            )}

            <CasingFields value={casing} onChange={setCasing} idPrefix="action-casing" />
            <SpringsFields value={springs} onChange={setSprings} idPrefix="action-springs" />
          </div>

          {/* Financials Section */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <h3 className="font-display text-sm font-bold text-[#0F3D6E]">
              ثانياً: المعلومات المالية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DecimalInput
                id="drilling-meters"
                label="عدد أمتار الحفر"
                value={drillingMeters}
                onChange={setDrillingMeters}
                unit="متر"
              />
              <DecimalInput
                id="price-per-meter"
                label="قيمة متر الحفر"
                value={pricePerMeter}
                onChange={setPricePerMeter}
                unit="للمتر"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="other-actions-desc"
                  className="block text-sm font-medium text-slate-800 mb-1.5"
                >
                  إجراءات أخرى (شرح نصي)
                </label>
                <input
                  id="other-actions-desc"
                  type="text"
                  value={otherActionsDesc}
                  onChange={(e) => setOtherActionsDesc(e.target.value)}
                  placeholder="مثال: مواد إكساء، أجور نقل، قطع غيار..."
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <DecimalInput
                id="other-actions-cost"
                label="قيمة الإجراءات الأخرى"
                value={otherActionsCost}
                onChange={setOtherActionsCost}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <span className="block text-xs font-medium text-slate-500">الإجمالي (تلقائي)</span>
                <p className="mt-1 font-mono text-lg font-bold tabular-nums text-slate-900">
                  {formatMoney(totalAmount)}
                </p>
              </div>
              <div>
                <DecimalInput
                  id="paid-amount"
                  label="القيمة المدفوعة"
                  value={paidAmount}
                  onChange={setPaidAmount}
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-500">الباقي (تلقائي)</span>
                <p
                  className={`mt-1 font-mono text-lg font-bold tabular-nums ${
                    remainingAmount > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {formatMoney(remainingAmount)}
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="action-notes"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                ملاحظات كاملة عن الإجراء
              </label>
              <textarea
                id="action-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="تفاصيل فنية إضافية، طبيعة الصخور، ملاحظات الدفع أو الاتفاق..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
            </div>

            {/* Future-ready Photo Attachments */}
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  صور مرفقة للإجراء (اختياري)
                </span>
                <label className="min-h-[40px] cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100">
                  <ImagePlus className="h-4 w-4 text-[#0F3D6E]" />
                  <span>إرفاق صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-square bg-white"
                    >
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAttachments((prev) => prev.filter((item) => item.id !== att.id))
                        }
                        aria-label="حذف الصورة"
                        className="absolute top-1 left-1 h-7 w-7 flex items-center justify-center rounded-md bg-slate-900/75 text-white hover:bg-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              <span>{editingAction ? 'حفظ التعديلات' : 'حفظ الإجراء'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
