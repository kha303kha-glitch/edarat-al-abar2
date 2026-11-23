import React, {useEffect, useState} from 'react';
import {X, Save} from 'lucide-react';
import type {Client} from '../types/models';
import {generateId, toLatinDigits} from '../utils/format';

interface ClientFormModalProps {
  open: boolean;
  editingClient?: Client | null;
  onSave: (client: Client) => void;
  onClose: () => void;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  open,
  editingClient,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<{name?: string; phone?: string}>({});

  useEffect(() => {
    if (!open) return;
    if (editingClient) {
      setName(editingClient.name);
      setPhone(editingClient.phone);
      setAddress(editingClient.address ?? '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
    }
    setErrors({});
  }, [open, editingClient]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = toLatinDigits(phone.trim());
    const nextErrors: {name?: string; phone?: string} = {};

    if (!trimmedName) {
      nextErrors.name = 'اسم العميل حقل إلزامي';
    }
    if (!trimmedPhone) {
      nextErrors.phone = 'رقم الهاتف حقل إلزامي';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const now = new Date().toISOString();
    const record: Client = editingClient
      ? {
          ...editingClient,
          name: trimmedName,
          phone: trimmedPhone,
          address: address.trim() || undefined,
          updatedAt: now,
        }
      : {
          id: generateId(),
          name: trimmedName,
          phone: trimmedPhone,
          address: address.trim() || undefined,
          createdAt: now,
        };

    onSave(record);
  };

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="client-modal-title" className="font-display text-lg font-bold text-slate-900">
            {editingClient ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
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

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
          <div>
            <label htmlFor="client-name" className="block text-sm font-medium text-slate-800 mb-1.5">
              اسم العميل <span className="text-red-600">*</span>
            </label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({...prev, name: undefined}));
              }}
              placeholder="الاسم الكامل للعميل"
              className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                  : 'border-slate-300 focus:border-[#0F3D6E] focus:ring-sky-100'
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="client-phone" className="block text-sm font-medium text-slate-800 mb-1.5">
              رقم الهاتف <span className="text-red-600">*</span>
            </label>
            <input
              id="client-phone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({...prev, phone: undefined}));
              }}
              placeholder="05xxxxxxxx"
              className={`w-full min-h-[44px] rounded-xl border bg-white px-3.5 py-2.5 text-sm font-mono tabular-nums text-right text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.phone
                  ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                  : 'border-slate-300 focus:border-[#0F3D6E] focus:ring-sky-100'
              }`}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="client-address" className="block text-sm font-medium text-slate-800 mb-1.5">
              مكان العمل / العنوان (اختياري)
            </label>
            <input
              id="client-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="المدينة، القرية، أو وصف الموقع"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0F3D6E] focus:outline-none focus:ring-2 focus:ring-sky-100"
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
              <span>{editingClient ? 'حفظ التعديلات' : 'حفظ العميل'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
