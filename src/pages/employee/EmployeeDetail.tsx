import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Car, Users, Phone, Building, FileText, XCircle, History } from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { StatusBadge } from '@/components/StatusBadge.js';
import { appointmentApi, recordApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { Appointment, PlateChangeAudit } from '@shared/types';

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [plateChanges, setPlateChanges] = useState<PlateChangeAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apt, changes] = await Promise.all([
        appointmentApi.get(id!),
        recordApi.getPlateChangeAudits(id!),
      ]);
      setAppointment(apt);
      setPlateChanges(changes);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('确定要取消该预约吗？')) return;

    setCancelling(true);
    try {
      await appointmentApi.cancel(id!);
      loadData();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <Layout role="employee">
        <div className="p-12 text-center text-gray-500">加载中...</div>
      </Layout>
    );
  }

  if (!appointment) {
    return (
      <Layout role="employee">
        <div className="p-12 text-center text-gray-500">预约不存在</div>
      </Layout>
    );
  }

  const canCancel = appointment.status === 'pending_info' || appointment.status === 'pending_entry';

  return (
    <Layout role="employee">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/employee')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">预约详情</h1>
                <StatusBadge status={appointment.status} />
              </div>
              <p className="text-gray-500 mt-1">预约号：{appointment.id}</p>
            </div>
          </div>
          {canCancel && (
            <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
              <XCircle size={16} className="mr-2" />
              {cancelling ? '取消中...' : '取消预约'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={18} className="text-gray-500" />
                  访客信息
                </h2>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="访客姓名" value={appointment.visitorName} />
                  <InfoItem label="联系电话" value={appointment.visitorPhone} />
                  <InfoItem
                    label="访客单位"
                    value={appointment.visitorCompany || '未填写'}
                  />
                  <InfoItem
                    label="车牌号"
                    value={formatPlateNumber(appointment.plateNumber)}
                  />
                  <InfoItem
                    label="同行人数"
                    value={`${appointment.companionCount} 人`}
                  />
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText size={18} className="text-gray-500" />
                  来访信息
                </h2>
              </Card.Header>
              <Card.Body>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="受访部门" value={appointment.department} />
                  <InfoItem label="受访员工" value={appointment.employeeName} />
                  <div className="col-span-2">
                    <InfoItem label="来访事由" value={appointment.purpose} />
                  </div>
                </div>
              </Card.Body>
            </Card>

            {plateChanges.length > 0 && (
              <Card>
                <Card.Header>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <History size={18} className="text-gray-500" />
                    车牌变更记录
                  </h2>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    {plateChanges.map((change, index) => (
                      <div
                        key={change.id}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-medium text-slate-600">
                          {plateChanges.length - index}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">原车牌：</span>
                            <span className="font-medium">
                              {change.oldPlateNumber || '无'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="text-gray-500">新车牌：</span>
                            <span className="font-medium text-slate-700">
                              {change.newPlateNumber}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {change.changedBy === 'visitor' ? '访客' : '员工'} 修改于{' '}
                            {formatDateTime(change.changedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar size={18} className="text-gray-500" />
                  预约时间
                </h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-emerald-500" />
                  <div>
                    <p className="text-sm text-gray-500">开始时间</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(appointment.startTime)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-red-500" />
                  <div>
                    <p className="text-sm text-gray-500">结束时间</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(appointment.endTime)}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Car size={18} className="text-gray-500" />
                  通行记录
                </h2>
              </Card.Header>
              <Card.Body className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      appointment.entryTime ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  />
                  <div>
                    <p className="text-sm text-gray-500">入园时间</p>
                    <p className="font-medium text-gray-900">
                      {appointment.entryTime
                        ? formatDateTime(appointment.entryTime)
                        : '未入园'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      appointment.exitTime ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                  <div>
                    <p className="text-sm text-gray-500">离园时间</p>
                    <p className="font-medium text-gray-900">
                      {appointment.exitTime
                        ? formatDateTime(appointment.exitTime)
                        : '未离园'}
                    </p>
                  </div>
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock size={18} className="text-gray-500" />
                  创建信息
                </h2>
              </Card.Header>
              <Card.Body className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">创建时间</span>
                  <span className="text-gray-900">
                    {formatDateTime(appointment.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">更新时间</span>
                  <span className="text-gray-900">
                    {formatDateTime(appointment.updatedAt)}
                  </span>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
