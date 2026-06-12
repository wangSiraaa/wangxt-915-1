import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Clock, Car, User, Building, LogIn, RefreshCw } from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { StatusBadge } from '@/components/StatusBadge.js';
import { extensionApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { Appointment } from '@shared/types';

export function SupervisorDetained() {
  const navigate = useNavigate();
  const [detainedList, setDetainedList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    over1h: 0,
    over2h: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await extensionApi.detectDetained();
      setDetainedList(result.appointments);
      setStats({
        total: result.count,
        over1h: result.appointments.filter(a => getDetainedHours(a.detainedAt!) >= 1).length,
        over2h: result.appointments.filter(a => getDetainedHours(a.detainedAt!) >= 2).length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDetainedHours = (detainedAt: string): number => {
    const now = new Date();
    const detained = new Date(detainedAt);
    return (now.getTime() - detained.getTime()) / (1000 * 60 * 60);
  };

  const getDetainedDuration = (detainedAt: string): string => {
    const hours = getDetainedHours(detainedAt);
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    if (h > 0) {
      return `${h}小时${m}分钟`;
    }
    return `${m}分钟`;
  };

  return (
    <Layout role="security_supervisor">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">滞留车辆</h1>
            <p className="text-gray-500 mt-1">查看超过预约结束时间未离园的车辆</p>
          </div>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw size={18} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="滞留车辆总数"
            value={stats.total}
            icon={<AlertTriangle size={24} />}
            color="red"
          />
          <StatCard
            label="滞留超过1小时"
            value={stats.over1h}
            icon={<Clock size={24} />}
            color="amber"
          />
          <StatCard
            label="滞留超过2小时"
            value={stats.over2h}
            icon={<Shield size={24} />}
            color="rose"
          />
        </div>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">滞留车辆列表</h2>
            </div>
          </Card.Header>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-8 text-center text-gray-500">加载中...</div>
            ) : detainedList.length === 0 ? (
              <div className="p-12 text-center">
                <Shield size={48} className="mx-auto text-emerald-400 mb-4" />
                <p className="text-gray-500">暂无滞留车辆</p>
                <p className="text-sm text-gray-400 mt-1">所有车辆均已按时离园</p>
              </div>
            ) : (
              detainedList.map((apt) => (
                <div
                  key={apt.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/employee/${apt.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                        <Car size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 font-mono">
                            {formatPlateNumber(apt.plateNumber!)}
                          </p>
                          <StatusBadge status={apt.status} />
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {apt.visitorName} · {apt.department}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">入园时间</p>
                        <p className="font-medium text-gray-900">
                          {apt.entryTime ? formatDateTime(apt.entryTime) : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">预约结束</p>
                        <p className="font-medium text-gray-500 line-through">
                          {apt.originalEndTime ? formatDateTime(apt.originalEndTime) : formatDateTime(apt.endTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-red-600 font-medium">已滞留</p>
                        <p className="font-bold text-red-700">
                          {apt.detainedAt ? getDetainedDuration(apt.detainedAt) : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                  {apt.entryGate && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <LogIn size={12} />
                        入口：{apt.entryGate}
                      </span>
                      {apt.exitGate && (
                        <span className="flex items-center gap-1">
                          出口：{apt.exitGate}
                        </span>
                      )}
                    </div>
                  )}
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
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <Card>
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
