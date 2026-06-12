import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, XCircle, AlertTriangle, User, Building, Car, ChevronRight, FileText, Filter } from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { extensionApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { ExtensionRequest, Appointment } from '@shared/types';
import { EXTENSION_STATUS_LABELS, EXTENSION_STATUS_COLORS } from '@shared/types';

type TabType = 'pending' | 'all';

export function SupervisorHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [extensions, setExtensions] = useState<ExtensionRequest[]>([]);
  const [appointments, setAppointments] = useState<Record<string, Appointment>>({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allExt, pendingExt] = await Promise.all([
        extensionApi.list(),
        extensionApi.list({ status: 'pending' }),
      ]);

      const list = activeTab === 'pending' ? pendingExt : allExt;
      setExtensions(list);

      const approvedCount = allExt.filter(e => e.status === 'approved').length;
      const rejectedCount = allExt.filter(e => e.status === 'rejected').length;
      setStats({
        pending: pendingExt.length,
        approved: approvedCount,
        rejected: rejectedCount,
      });

      const aptMap: Record<string, Appointment> = {};
      for (const ext of list) {
        try {
          const details = await extensionApi.getAppointmentDetails(ext.appointmentId);
          aptMap[ext.appointmentId] = details.appointment;
        } catch (e) {
          console.error(e);
        }
      }
      setAppointments(aptMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="security_supervisor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">延期审批</h1>
          <p className="text-gray-500 mt-1">审批访客车辆延期申请</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="待审批"
            value={stats.pending}
            icon={<Clock size={24} />}
            color="amber"
            active={activeTab === 'pending'}
            onClick={() => setActiveTab('pending')}
          />
          <StatCard
            label="已批准"
            value={stats.approved}
            icon={<CheckCircle size={24} />}
            color="emerald"
            active={false}
            onClick={() => {}}
          />
          <StatCard
            label="已拒绝"
            value={stats.rejected}
            icon={<XCircle size={24} />}
            color="rose"
            active={false}
            onClick={() => {}}
          />
        </div>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'pending' ? '待审批申请' : '全部申请'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'pending'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    待审批
                  </button>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'all'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    全部
                  </button>
                </div>
                <Button size="sm" variant="ghost" onClick={loadData}>
                  刷新
                </Button>
              </div>
            </div>
          </Card.Header>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : extensions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无延期申请</div>
            ) : (
              extensions.map((ext) => {
                const apt = appointments[ext.appointmentId];
                return (
                  <div
                    key={ext.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/supervisor/extension/${ext.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${EXTENSION_STATUS_COLORS[ext.status]}`}>
                          {ext.status === 'pending' && <Clock size={22} />}
                          {ext.status === 'approved' && <CheckCircle size={22} />}
                          {ext.status === 'rejected' && <XCircle size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 font-mono">
                              {apt ? formatPlateNumber(apt.plateNumber!) : '-'}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${EXTENSION_STATUS_COLORS[ext.status]}`}>
                              {EXTENSION_STATUS_LABELS[ext.status]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {apt?.visitorName || '-'} · {apt?.department || '-'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            申请时间：{formatDateTime(ext.requestedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">延期至</p>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(ext.newEndTime)}
                          </p>
                        </div>
                        <ChevronRight size={20} className="text-gray-300" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <Card className={active ? 'ring-2 ring-purple-500 ring-offset-2' : ''} onClick={onClick}>
      <Card.Body>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
