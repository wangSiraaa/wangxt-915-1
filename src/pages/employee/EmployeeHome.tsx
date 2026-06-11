import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { StatusBadge } from '@/components/StatusBadge.js';
import { useAppStore } from '@/store/useAppStore.js';
import { appointmentApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { Appointment, AppointmentStatus } from '@shared/types';

const tabs: { key: AppointmentStatus | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_info', label: '待补全' },
  { key: 'pending_entry', label: '待入园' },
  { key: 'entered', label: '已入园' },
  { key: 'exited', label: '已离园' },
  { key: 'cancelled', label: '已取消' },
];

export function EmployeeHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AppointmentStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const appointments = useAppStore((state) => state.appointments);
  const loading = useAppStore((state) => state.loading);
  const fetchAppointments = useAppStore((state) => state.fetchAppointments);
  const [currentEmployee] = useState({ name: '李工', phone: '13900139001' });

  useEffect(() => {
    const params: { status?: string; employeePhone?: string } = { employeePhone: currentEmployee.phone };
    if (activeTab !== 'all') {
      params.status = activeTab;
    }
    fetchAppointments(params);
  }, [activeTab, fetchAppointments, currentEmployee.phone]);

  const filteredAppointments = appointments.filter((apt) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      apt.visitorName.toLowerCase().includes(term) ||
      apt.plateNumber?.toLowerCase().includes(term) ||
      apt.visitorCompany?.toLowerCase().includes(term) ||
      apt.purpose.toLowerCase().includes(term)
    );
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'pending_info' || a.status === 'pending_entry').length,
    entered: appointments.filter((a) => a.status === 'entered').length,
    completed: appointments.filter((a) => a.status === 'exited').length,
  };

  const handleViewDetail = (id: string) => {
    navigate(`/employee/${id}`);
  };

  return (
    <Layout role="employee">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">预约管理</h1>
            <p className="text-gray-500 mt-1">管理您发起的访客预约</p>
          </div>
          <Button size="lg" onClick={() => navigate('/employee/new')}>
            <Plus size={18} className="mr-2" />
            新建预约
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard label="全部预约" value={stats.total} color="slate" />
          <StatCard label="待处理" value={stats.pending} color="amber" />
          <StatCard label="已入园" value={stats.entered} color="emerald" />
          <StatCard label="已完成" value={stats.completed} color="blue" />
        </div>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">预约列表</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索访客、车牌、事由..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                  <Filter size={18} />
                </button>
              </div>
            </div>
          </Card.Header>

          <div className="border-b border-gray-100 px-6">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-slate-800 text-slate-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-12 text-center text-gray-500">加载中...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-12 text-center text-gray-500">暂无预约记录</div>
            ) : (
              filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => handleViewDetail(apt.id)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                        <span className="text-lg font-semibold text-slate-600">
                          {apt.visitorName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">{apt.visitorName}</h3>
                          <StatusBadge status={apt.status} />
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{apt.visitorCompany || '未填写单位'}</span>
                          <span>·</span>
                          <span>{formatPlateNumber(apt.plateNumber)}</span>
                          <span>·</span>
                          <span>{apt.purpose}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        {formatDateTime(apt.startTime)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        至 {formatDateTime(apt.endTime)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
  };

  return (
    <Card>
      <Card.Body>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
            <span className="text-2xl font-bold">{value}</span>
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}
