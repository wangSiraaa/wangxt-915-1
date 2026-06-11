import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car, Clock, User } from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { StatusBadge } from '@/components/StatusBadge.js';
import { appointmentApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { Appointment } from '@shared/types';

export function VisitorHome() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('13800138001');
  const [searchPhone, setSearchPhone] = useState('13800138001');

  const loadAppointments = async () => {
    if (!searchPhone) return;

    setLoading(true);
    try {
      const all = await appointmentApi.list();
      const filtered = all.filter((a) => a.visitorPhone === searchPhone);
      setAppointments(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [searchPhone]);

  const handleSearch = () => {
    setSearchPhone(phone);
  };

  const handleViewDetail = (id: string, status: string) => {
    if (status === 'pending_info') {
      navigate(`/visitor/${id}`);
    } else {
      navigate(`/visitor/${id}`);
    }
  };

  const pendingCount = appointments.filter((a) => a.status === 'pending_info').length;

  return (
    <Layout role="visitor">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的预约</h1>
          <p className="text-gray-500 mt-1">查看并管理您的访客预约</p>
        </div>

        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">查询预约</h2>
          </Card.Header>
          <Card.Body>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="请输入您的手机号查询预约"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors"
              >
                查询
              </button>
            </div>
          </Card.Body>
        </Card>

        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-amber-900">
                您有 {pendingCount} 个预约待补充信息
              </p>
              <p className="text-sm text-amber-700">请尽快完善车辆信息以便顺利入园</p>
            </div>
          </div>
        )}

        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">预约列表</h2>
          </Card.Header>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="p-12 text-center text-gray-500">加载中...</div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Car size={48} className="mx-auto text-gray-300 mb-4" />
                <p>暂无预约记录</p>
                <p className="text-sm text-gray-400 mt-1">请输入手机号查询您的预约</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <div
                  key={apt.id}
                  onClick={() => handleViewDetail(apt.id, apt.status)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <User size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">
                            {apt.department} - {apt.employeeName}
                          </h3>
                          <StatusBadge status={apt.status} />
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{formatPlateNumber(apt.plateNumber) || '未填写车牌'}</span>
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
