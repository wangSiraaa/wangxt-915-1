import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Building,
  Car,
  FileText,
  Users,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Shield,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { StatusBadge } from '@/components/StatusBadge.js';
import { extensionApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { ExtensionRequest, Appointment, TimelineEvent } from '@shared/types';
import {
  EXTENSION_STATUS_LABELS,
  EXTENSION_STATUS_COLORS,
  TIMELINE_ACTION_LABELS,
} from '@shared/types';

export function SupervisorExtensionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [extension, setExtension] = useState<ExtensionRequest | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [parkClosingTime, setParkClosingTime] = useState({ hour: 22, minute: 0 });

  useEffect(() => {
    if (id) {
      loadData();
      loadParkClosingTime();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const ext = await extensionApi.get(id);
      setExtension(ext);

      const details = await extensionApi.getAppointmentDetails(ext.appointmentId);
      setAppointment(details.appointment);
      setTimeline(details.timeline);
    } catch (err) {
      console.error(err);
      alert('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadParkClosingTime = async () => {
    try {
      const time = await extensionApi.getParkClosingTime();
      setParkClosingTime(time);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    if (!confirm('确认批准此延期申请？')) return;

    setProcessing(true);
    try {
      await extensionApi.approve(id, '安保主管');
      alert('批准成功');
      loadData();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    if (!rejectReason.trim()) {
      alert('请填写拒绝原因');
      return;
    }

    setProcessing(true);
    try {
      await extensionApi.reject(id, rejectReason, '安保主管');
      alert('已拒绝');
      setShowRejectModal(false);
      loadData();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setProcessing(false);
    }
  };

  const isPending = extension?.status === 'pending';

  if (loading) {
    return (
      <Layout role="security_supervisor">
        <div className="p-8 text-center text-gray-500">加载中...</div>
      </Layout>
    );
  }

  if (!extension || !appointment) {
    return (
      <Layout role="security_supervisor">
        <div className="p-8 text-center text-gray-500">未找到申请记录</div>
      </Layout>
    );
  }

  return (
    <Layout role="security_supervisor">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/supervisor')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">延期申请详情</h1>
            <p className="text-gray-500 mt-1">审批访客车辆延期申请</p>
          </div>
        </div>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${EXTENSION_STATUS_COLORS[extension.status]}`}>
                  {extension.status === 'pending' && <Clock size={24} />}
                  {extension.status === 'approved' && <CheckCircle size={24} />}
                  {extension.status === 'rejected' && <XCircle size={24} />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">延期申请</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${EXTENSION_STATUS_COLORS[extension.status]}`}>
                    {EXTENSION_STATUS_LABELS[extension.status]}
                  </span>
                </div>
              </div>
              {isPending && (
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                  >
                    <XCircle size={18} className="mr-2" />
                    拒绝
                  </Button>
                  <Button
                    variant="success"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    <CheckCircle size={18} className="mr-2" />
                    批准
                  </Button>
                </div>
              )}
            </div>
          </Card.Header>
          <Card.Body className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <InfoItem
                icon={<Car size={18} className="text-blue-500" />}
                label="车牌号"
                value={formatPlateNumber(appointment.plateNumber!)}
              />
              <InfoItem
                icon={<User size={18} className="text-blue-500" />}
                label="访客姓名"
                value={appointment.visitorName}
              />
              <InfoItem
                icon={<Building size={18} className="text-blue-500" />}
                label="受访部门"
                value={appointment.department}
              />
              <InfoItem
                icon={<User size={18} className="text-blue-500" />}
                label="受访员工"
                value={appointment.employeeName}
              />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
                <Calendar size={16} />
                时间信息
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">原预约开始</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatDateTime(appointment.startTime)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">原预约结束</p>
                  <p className="font-medium text-gray-900 mt-1 line-through text-gray-400">
                    {formatDateTime(appointment.originalEndTime || appointment.endTime)}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-xs text-amber-600 font-medium">申请延期至</p>
                  <p className="font-semibold text-amber-900 mt-1">
                    {formatDateTime(extension.newEndTime)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                园区闭园时间：每日 {parkClosingTime.hour.toString().padStart(2, '0')}:{parkClosingTime.minute.toString().padStart(2, '0')}
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <MessageSquare size={16} />
                延期原因
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{extension.reason}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Building size={16} />
                受访部门确认
              </h3>
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                <p className="text-emerald-700">{extension.departmentConfirm}</p>
              </div>
            </div>

            {extension.status === 'rejected' && extension.rejectReason && (
              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                  <XCircle size={16} className="text-rose-500" />
                  拒绝原因
                </h3>
                <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
                  <p className="text-rose-700">{extension.rejectReason}</p>
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <User size={16} />
                申请人
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{extension.requestedBy}</p>
                    <p className="text-sm text-gray-500">员工</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  申请时间：{formatDateTime(extension.requestedAt)}
                </p>
              </div>
            </div>

            {appointment.isDetained && (
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100">
                <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">车辆已滞留</p>
                  <p className="text-sm text-red-600 mt-1">
                    滞留时间：{appointment.detainedAt ? formatDateTime(appointment.detainedAt) : '-'}
                  </p>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock size={20} className="text-gray-400" />
              操作时间线
            </h2>
          </Card.Header>
          <Card.Body>
            <div className="relative">
              {timeline.map((event, index) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      index === 0 ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getTimelineIcon(event.action)}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-100 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">
                        {TIMELINE_ACTION_LABELS[event.action] || event.action}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateTime(event.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {event.operator} · {getRoleLabel(event.operatorRole)}
                    </p>
                    {event.remark && (
                      <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-3">
                        {event.remark}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">拒绝延期申请</h3>
            <p className="text-sm text-gray-500 mb-4">请填写拒绝原因</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none h-32"
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="ghost"
                onClick={() => setShowRejectModal(false)}
                disabled={processing}
              >
                取消
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
              >
                {processing ? '处理中...' : '确认拒绝'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function getTimelineIcon(action: string) {
  switch (action) {
    case 'appointment_created':
      return <FileText size={16} />;
    case 'entered_park':
      return <LogIn size={16} />;
    case 'exited_park':
      return <LogOut size={16} />;
    case 'detained':
      return <AlertTriangle size={16} />;
    case 'extension_requested':
      return <Clock size={16} />;
    case 'extension_approved':
      return <CheckCircle size={16} />;
    case 'extension_rejected':
      return <XCircle size={16} />;
    default:
      return <Clock size={16} />;
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'employee':
      return '员工';
    case 'guard':
      return '门岗';
    case 'security_supervisor':
      return '安保主管';
    case 'visitor':
      return '访客';
    case 'system':
      return '系统';
    default:
      return role;
  }
}
