/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {ActionFormModal} from './components/ActionFormModal';
import {BackupModal} from './components/BackupModal';
import {ClientDetailView} from './components/ClientDetailView';
import {ClientFormModal} from './components/ClientFormModal';
import {ClientListView} from './components/ClientListView';
import {ConfirmDialog} from './components/ConfirmDialog';
import {PreDrillingSurveyView} from './components/PreDrillingSurveyView';
import {SurveyPointFormModal} from './components/SurveyPointFormModal';
import {ToastContainer, type ToastMessage} from './components/ToastContainer';
import {TopBar} from './components/TopBar';
import {WellDetailView} from './components/WellDetailView';
import {WellFormModal} from './components/WellFormModal';
import {WellReportModal} from './components/WellReportModal';
import {
  deleteRecord,
  loadAllData,
  putRecord,
  replaceAllData,
  type AppDatabaseState,
} from './db/storage';
import type {
  BackupPayload,
  Client,
  PreDrillingPoint,
  Well,
  WellAction,
} from './types/models';
import {generateId, getActionTitle} from './utils/format';

type RouteState =
  | {screen: 'home'}
  | {screen: 'client'; clientId: string}
  | {screen: 'well'; clientId: string; wellId: string}
  | {screen: 'survey'; clientId: string};

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
}

export default function App() {
  const [db, setDb] = useState<AppDatabaseState>({
    clients: [],
    wells: [],
    actions: [],
    surveyPoints: [],
  });
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState<RouteState>({screen: 'home'});
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [wellModalOpen, setWellModalOpen] = useState(false);
  const [editingWell, setEditingWell] = useState<Well | null>(null);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<WellAction | null>(null);

  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PreDrillingPoint | null>(null);

  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'تأكيد الحذف',
    onConfirm: () => {},
  });

  const notify = useCallback((type: ToastMessage['type'], message: string) => {
    const id = generateId();
    setToasts((prev) => [...prev, {id, type, message}]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  useEffect(() => {
    let active = true;
    loadAllData()
      .then((state) => {
        if (active) {
          setDb(state);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setLoading(false);
          notify('error', 'تعذر تحميل قاعدة البيانات المحلية.');
        }
      });
    return () => {
      active = false;
    };
  }, [notify]);

  const activeClient = useMemo(() => {
    if (route.screen === 'home') return undefined;
    return db.clients.find((c) => c.id === route.clientId);
  }, [db.clients, route]);

  const activeWell = useMemo(() => {
    if (route.screen !== 'well') return undefined;
    return db.wells.find((w) => w.id === route.wellId);
  }, [db.wells, route]);

  const activeClientWells = useMemo(() => {
    if (!activeClient) return [];
    return db.wells.filter((w) => w.clientId === activeClient.id);
  }, [db.wells, activeClient]);

  const activeClientActions = useMemo(() => {
    if (!activeClient) return [];
    return db.actions.filter((a) => a.clientId === activeClient.id);
  }, [db.actions, activeClient]);

  const activeClientSurveyPoints = useMemo(() => {
    if (!activeClient) return [];
    return db.surveyPoints.filter((p) => p.clientId === activeClient.id);
  }, [db.surveyPoints, activeClient]);

  const activeWellActions = useMemo(() => {
    if (!activeWell) return [];
    return db.actions.filter((a) => a.wellId === activeWell.id);
  }, [db.actions, activeWell]);

  // --- CRUD Handlers ---

  const handleSaveClient = async (client: Client) => {
    const exists = db.clients.some((c) => c.id === client.id);
    const nextClients = exists
      ? db.clients.map((c) => (c.id === client.id ? client : c))
      : [client, ...db.clients];
    const nextState: AppDatabaseState = {...db, clients: nextClients};

    setDb(nextState);
    await putRecord('clients', client, nextState);
    setClientModalOpen(false);
    setEditingClient(null);
    notify('success', exists ? 'تم تحديث بيانات العميل بنجاح.' : 'تمت إضافة العميل بنجاح.');
  };

  const requestDeleteClient = (client: Client) => {
    const wellCount = db.wells.filter((w) => w.clientId === client.id).length;
    const actionCount = db.actions.filter((a) => a.clientId === client.id).length;
    const pointCount = db.surveyPoints.filter((p) => p.clientId === client.id).length;

    setConfirmState({
      open: true,
      title: `حذف العميل «${client.name}»؟`,
      message: `تنبيه: سيؤدي حذف هذا العميل إلى حذف جميع البيانات المرتبطة به نهائياً:\n• ${wellCount} آبار\n• ${actionCount} إجراءات ومبالغ مالية\n• ${pointCount} نقاط ما قبل الحفر`,
      confirmLabel: 'حذف العميل نهائياً',
      onConfirm: async () => {
        const nextState: AppDatabaseState = {
          clients: db.clients.filter((c) => c.id !== client.id),
          wells: db.wells.filter((w) => w.clientId !== client.id),
          actions: db.actions.filter((a) => a.clientId !== client.id),
          surveyPoints: db.surveyPoints.filter((p) => p.clientId !== client.id),
        };
        setDb(nextState);
        await replaceAllData(nextState);
        setConfirmState((prev) => ({...prev, open: false}));
        setRoute({screen: 'home'});
        notify('success', 'تم حذف العميل وجميع بياناته المرتبطة.');
      },
    });
  };

  const handleSaveWell = async (well: Well) => {
    const exists = db.wells.some((w) => w.id === well.id);
    const nextWells = exists
      ? db.wells.map((w) => (w.id === well.id ? well : w))
      : [well, ...db.wells];
    const nextState: AppDatabaseState = {...db, wells: nextWells};

    setDb(nextState);
    await putRecord('wells', well, nextState);
    setWellModalOpen(false);
    setEditingWell(null);
    notify('success', exists ? 'تم تحديث بيانات البئر بنجاح.' : 'تمت إضافة البئر بنجاح.');
  };

  const requestDeleteWell = (well: Well) => {
    const actionCount = db.actions.filter((a) => a.wellId === well.id).length;
    setConfirmState({
      open: true,
      title: `حذف البئر «${well.name}»؟`,
      message: `سيتم حذف هذا البئر وجميع الإجراءات المرتبطة به (${actionCount} إجراء) نهائياً ولا يمكن التراجع عن ذلك.`,
      confirmLabel: 'حذف البئر',
      onConfirm: async () => {
        const nextState: AppDatabaseState = {
          ...db,
          wells: db.wells.filter((w) => w.id !== well.id),
          actions: db.actions.filter((a) => a.wellId !== well.id),
        };
        setDb(nextState);
        await replaceAllData(nextState);
        setConfirmState((prev) => ({...prev, open: false}));
        setRoute({screen: 'client', clientId: well.clientId});
        notify('success', 'تم حذف البئر وإجراءاته بنجاح.');
      },
    });
  };

  const handleSaveAction = async (action: WellAction) => {
    const exists = db.actions.some((a) => a.id === action.id);
    const nextActions = exists
      ? db.actions.map((a) => (a.id === action.id ? action : a))
      : [...db.actions, action];
    const nextState: AppDatabaseState = {...db, actions: nextActions};

    setDb(nextState);
    await putRecord('actions', action, nextState);
    setActionModalOpen(false);
    setEditingAction(null);
    notify('success', exists ? 'تم تحديث الإجراء بنجاح.' : 'تم حفظ الإجراء وتحديث الرصيد تلقائياً.');
  };

  const requestDeleteAction = (action: WellAction) => {
    setConfirmState({
      open: true,
      title: `حذف إجراء «${getActionTitle(action)}»؟`,
      message: 'سيتم حذف هذا الإجراء وإعادة احتساب المبلغ المتبقي للبئر والعميل تلقائياً.',
      confirmLabel: 'حذف الإجراء',
      onConfirm: async () => {
        const nextActions = db.actions.filter((a) => a.id !== action.id);
        const nextState: AppDatabaseState = {...db, actions: nextActions};
        setDb(nextState);
        await deleteRecord('actions', action.id, nextState);
        setConfirmState((prev) => ({...prev, open: false}));
        notify('success', 'تم حذف الإجراء بنجاح.');
      },
    });
  };

  const handleSaveSurveyPoint = async (point: PreDrillingPoint) => {
    const exists = db.surveyPoints.some((p) => p.id === point.id);
    const nextPoints = exists
      ? db.surveyPoints.map((p) => (p.id === point.id ? point : p))
      : [...db.surveyPoints, point];
    const nextState: AppDatabaseState = {...db, surveyPoints: nextPoints};

    setDb(nextState);
    await putRecord('surveyPoints', point, nextState);
    setSurveyModalOpen(false);
    setEditingPoint(null);
    notify('success', exists ? `تم تحديث نقطة ${point.pointNumber}.` : `تمت إضافة نقطة ${point.pointNumber}.`);
  };

  const requestDeleteSurveyPoint = (point: PreDrillingPoint) => {
    setConfirmState({
      open: true,
      title: `حذف نقطة ${point.pointNumber}؟`,
      message: 'سيتم حذف هذه النقطة وجميع بيانات النبوع المسجلة فيها، وإعادة ترقيم النقاط التالية تلقائياً.',
      confirmLabel: 'حذف النقطة',
      onConfirm: async () => {
        const remainingForClient = db.surveyPoints
          .filter((p) => p.clientId === point.clientId && p.id !== point.id)
          .sort((a, b) => a.pointNumber - b.pointNumber)
          .map((p, idx) => ({...p, pointNumber: idx + 1}));

        const otherClientsPoints = db.surveyPoints.filter(
          (p) => p.clientId !== point.clientId
        );

        const nextState: AppDatabaseState = {
          ...db,
          surveyPoints: [...otherClientsPoints, ...remainingForClient],
        };
        setDb(nextState);
        await replaceAllData(nextState);
        setConfirmState((prev) => ({...prev, open: false}));
        notify('success', 'تم حذف نقطة المسح بنجاح.');
      },
    });
  };

  const handleRestoreBackup = async (payload: BackupPayload) => {
    const nextState: AppDatabaseState = {
      clients: payload.clients,
      wells: payload.wells,
      actions: payload.actions,
      surveyPoints: payload.surveyPoints,
    };
    setDb(nextState);
    await replaceAllData(nextState);
    setRoute({screen: 'home'});
    notify('success', 'تمت استعادة النسخة الاحتياطية بنجاح.');
  };

  const nextSurveyPointNumber = useMemo(() => {
    if (activeClientSurveyPoints.length >= 10) return 10;
    const used = new Set(activeClientSurveyPoints.map((p) => p.pointNumber));
    for (let i = 1; i <= 10; i++) {
      if (!used.has(i)) return i;
    }
    return activeClientSurveyPoints.length + 1;
  }, [activeClientSurveyPoints]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar
        onGoHome={() => setRoute({screen: 'home'})}
        onOpenBackup={() => setBackupModalOpen(true)}
        onAddClient={() => {
          setEditingClient(null);
          setClientModalOpen(true);
        }}
      />

      <main className="no-print mx-auto max-w-6xl px-4 sm:px-6 py-5 sm:py-7">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            جاري تحميل البيانات المحلية...
          </div>
        ) : route.screen === 'home' ? (
          <ClientListView
            clients={db.clients}
            wells={db.wells}
            actions={db.actions}
            onSelectClient={(clientId) => setRoute({screen: 'client', clientId})}
            onAddClient={() => {
              setEditingClient(null);
              setClientModalOpen(true);
            }}
          />
        ) : route.screen === 'client' && activeClient ? (
          <ClientDetailView
            client={activeClient}
            wells={activeClientWells}
            actions={activeClientActions}
            surveyPoints={activeClientSurveyPoints}
            onBack={() => setRoute({screen: 'home'})}
            onEditClient={() => {
              setEditingClient(activeClient);
              setClientModalOpen(true);
            }}
            onDeleteClient={() => requestDeleteClient(activeClient)}
            onAddWell={() => {
              setEditingWell(null);
              setWellModalOpen(true);
            }}
            onSelectWell={(wellId) =>
              setRoute({screen: 'well', clientId: activeClient.id, wellId})
            }
            onOpenSurveyPoints={() =>
              setRoute({screen: 'survey', clientId: activeClient.id})
            }
          />
        ) : route.screen === 'well' && activeClient && activeWell ? (
          <WellDetailView
            client={activeClient}
            well={activeWell}
            actions={activeWellActions}
            onBackToClient={() =>
              setRoute({screen: 'client', clientId: activeClient.id})
            }
            onEditWell={() => {
              setEditingWell(activeWell);
              setWellModalOpen(true);
            }}
            onDeleteWell={() => requestDeleteWell(activeWell)}
            onAddAction={() => {
              setEditingAction(null);
              setActionModalOpen(true);
            }}
            onEditAction={(action) => {
              setEditingAction(action);
              setActionModalOpen(true);
            }}
            onDeleteAction={requestDeleteAction}
            onOpenReport={() => setReportModalOpen(true)}
          />
        ) : route.screen === 'survey' && activeClient ? (
          <PreDrillingSurveyView
            client={activeClient}
            points={activeClientSurveyPoints}
            onBack={() => setRoute({screen: 'client', clientId: activeClient.id})}
            onAddPoint={() => {
              setEditingPoint(null);
              setSurveyModalOpen(true);
            }}
            onEditPoint={(point) => {
              setEditingPoint(point);
              setSurveyModalOpen(true);
            }}
            onDeletePoint={requestDeleteSurveyPoint}
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
            <p className="text-sm text-slate-600">لم يتم العثور على السجل المطلوب.</p>
            <button
              type="button"
              onClick={() => setRoute({screen: 'home'})}
              className="min-h-[44px] rounded-xl bg-[#0F3D6E] px-5 py-2 text-sm font-semibold text-white"
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <ClientFormModal
        open={clientModalOpen}
        editingClient={editingClient}
        onSave={handleSaveClient}
        onClose={() => {
          setClientModalOpen(false);
          setEditingClient(null);
        }}
      />

      {activeClient && (
        <WellFormModal
          open={wellModalOpen}
          clientId={activeClient.id}
          editingWell={editingWell}
          onSave={handleSaveWell}
          onClose={() => {
            setWellModalOpen(false);
            setEditingWell(null);
          }}
        />
      )}

      {activeClient && activeWell && (
        <>
          <ActionFormModal
            open={actionModalOpen}
            wellId={activeWell.id}
            clientId={activeClient.id}
            editingAction={editingAction}
            onSave={handleSaveAction}
            onClose={() => {
              setActionModalOpen(false);
              setEditingAction(null);
            }}
          />

          <WellReportModal
            open={reportModalOpen}
            client={activeClient}
            well={activeWell}
            actions={activeWellActions}
            onClose={() => setReportModalOpen(false)}
          />
        </>
      )}

      {activeClient && (
        <SurveyPointFormModal
          open={surveyModalOpen}
          clientId={activeClient.id}
          pointNumber={nextSurveyPointNumber}
          editingPoint={editingPoint}
          onSave={handleSaveSurveyPoint}
          onClose={() => {
            setSurveyModalOpen(false);
            setEditingPoint(null);
          }}
        />
      )}

      <BackupModal
        open={backupModalOpen}
        dbState={db}
        onRestore={handleRestoreBackup}
        onNotify={notify}
        onClose={() => setBackupModalOpen(false)}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({...prev, open: false}))}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
