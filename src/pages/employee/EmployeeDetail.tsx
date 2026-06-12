import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Car,
  Users,
  Phone,
  Building,
  FileText,
  XCircle,
  History,
  Clock3,
  CheckCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { StatusBadge } from '@/components/StatusBadge.js';
import { appointmentApi, recordApi, extensionApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { Appointment, PlateChangeAudit, TimelineEvent, ExtensionRequest } from '@shared/types';

export function EmployeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [plateChanges, setPlateChanges] = useState<PlateChangeAudit[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [extensions, setExtensions] = useState<ExtensionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionForm, setExtensionForm] = useState({
    reason: '',
    newEndTime: '',
    departmentConfirm: '',
  });
  const [submittingExtension, setSubmittingExtension] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apt, changes, tl, exts] = await Promise.all([
        appointmentApi.get(id!),
        recordApi.getPlateChangeAudits(id!),
        extensionApi.getTimeline(id!),
        extensionApi.getByAppointment(id!),
      ]);
      setAppointment(apt);
      setPlateChanges(changes);
      setTimeline(tl);
      setExtensions(exts);
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

  const handleExtensionSubmit = async () => {
    if (!extensionForm.reason.trim()) {
      alert('请填写延期原因');
      return;
    }
    if (!extensionForm.newEndTime) {
      alert('请选择新的结束时间');
      return;
    }
    if (!extensionForm.departmentConfirm.trim()) {
      alert('请填写受访部门确认');
      return;
    }

    setSubmittingExtension(true);
    try {
      await extensionApi.create({
        appointmentId: id!,
        reason: extensionForm.reason,
        newEndTime: new Date(extensionForm.newEndTime).toISOString(),
        departmentConfirm: extensionForm.departmentConfirm,
        requestedBy: appointment?.employeeName || '员工',
        operator: appointment?.employeeName || '员工',
        operatorRole: 'employee',
      });
      setShowExtensionModal(false);
      setExtensionForm({ reason: '', newEndTime: '', departmentConfirm: '' });
      loadData();
      alert('延期申请已提交，请等待审批');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSubmittingExtension(false);
    }
  };

  const canCancel = appointment?.status === 'pending_info' || appointment?.status === 'pending_entry';
  const canExtend = appointment && 
    appointment.status !== 'exited' && 
    appointment.status !== 'cancelled' && 
    appointment.status !== 'expired' &&
    !extensions.some(e => e.status === 'pending');

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
                {appointment.isDetained && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    已滞留
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1">预约号：{appointment.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canExtend && (
              <Button
                variant="primary"
                onClick={() => setShowExtensionModal(true)}
              >
                <Clock3 size={16} className="mr-2" />
                申请延期
              </Button>
            )}
            {canCancel && (
              <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
                <XCircle size={16} className="mr-2" />
                {cancelling ? '取消中...' : '取消预约'}
              </Button>
            )}
          </div>
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

            {extensions.length > 0 && (
              <Card>
                <Card.Header>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock3 size={18} className="text-gray-500" />
                    延期申请记录
                  </h2>
                </Card.Header>
                <Card.Body>
                  <div className="space-y-3">
                    {extensions.map((ext) => (
                      <div
                        key={ext.id}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                ext.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ext.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ext.status === 'approved'
                                ? '已批准'
                                : ext.status === 'rejected'
                                ? '已拒绝'
                                : '待审批'}
                            </span>
                            <span className="text-sm text-gray-500">
                              申请时间：{formatDateTime(ext.requestedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">延期至：</span>
                            <span className="text-gray-900 font-medium">
                              {formatDateTime(ext.newEndTime)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">受访部门确认：</span>
                            <span className="text-gray-900">{ext.departmentConfirm}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">延期原因：</span>
                            <span className="text-gray-900">{ext.reason}</span>
                          </div>
                          {ext.rejectReason && (
                            <div className="col-span-2">
                              <span className="text-gray-500">拒绝原因：</span>
                              <span className="text-rose-600">{ext.rejectReason}</span>
                            </div>
                          )}
                          {ext.approver && (
                            <div>
                              <span className="text-gray-500">审批人：</span>
                              <span className="text-gray-900">{ext.approver}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}

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

            <Card>
              <Card.Header>
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock size={18} className="text-gray-500" />
                  操作时间线
                </h2>
              </Card.Header>
              <Card.Body>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative pl-10">
                        <div
                          className={`absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center ${
                            event.action === 'entered_park'
                              ? 'bg-emerald-100 text-emerald-600'
                              : event.action === 'exited_park'
                              ? 'bg-slate-100 text-slate-600'
                              : event.action === 'detained'
                              ? 'bg-red-100 text-red-600'
                              : event.action === 'extension_requested'
                              ? 'bg-amber-100 text-amber-600'
                              : event.action === 'extension_approved'
                              ? 'bg-emerald-100 text-emerald-600'
                              : event.action === 'extension_rejected'
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {event.action === 'entered_park' && <CheckCircle size={16} />}
                          {event.action === 'exited_park' && <CheckCircle size={16} />}
                          {event.action === 'detained' && <AlertTriangle size={16} />}
                          {event.action === 'extension_requested' && <Clock3 size={16} />}
                          {event.action === 'extension_approved' && <CheckCircle size={16} />}
                          {event.action === 'extension_rejected' && <XCircle size={16} />}
                          {!['entered_park', 'exited_park', 'detained', 'extension_requested', 'extension_approved', 'extension_rejected'].includes(event.action) && <Plus size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {getTimelineActionLabel(event.action)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-0.5">
                            操作人：{event.operator} ({getRoleLabel(event.operatorRole)})
                          </div>
                          {event.remark && (
                            <div className="text-sm text-gray-600 mt-1">{event.remark}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
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
                    {appointment.originalEndTime && (
                      <p className="text-xs text-gray-400 line-through">
                        原结束时间：{formatDateTime(appointment.originalEndTime)}
                      </p>
                    )}
                  </div>
                </div>
                {appointment.isDetained && appointment.detainedAt && (
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-red-500" />
                    <div>
                      <p className="text-sm text-gray-500">滞留时间</p>
                      <p className="font-medium text-red-600">
                        {formatDateTime(appointment.detainedAt)}
                      </p>
                    </div>
                  </div>
                )}
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
                    {appointment.entryGate && (
                      <p className="text-xs text-gray-400">
                        入口：{appointment.entryGate}
                      </p>
                    )}
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
                    {appointment.exitGate && (
                      <p className="text-xs text-gray-400">
                        出口：{appointment.exitGate}
                      </p>
                    )}
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

      {showExtensionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">申请延期</h3>
              <p className="text-gray-500 mt-1">填写延期信息并提交审批</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  当前结束时间
                </label>
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-600">
                  {formatDateTime(appointment.endTime)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新结束时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={extensionForm.newEndTime}
                  onChange={(e) =>
                    setExtensionForm({ ...extensionForm, newEndTime: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-400 mt-1">
                  延期时间不能超过园区闭园时间（22:00）
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  延期原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={extensionForm.reason}
                  onChange={(e) =>
                    setExtensionForm({ ...extensionForm, reason: e.target.value })
                  }
                  placeholder="请说明延期原因"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  受访部门确认 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={extensionForm.departmentConfirm}
                  onChange={(e) =>
                    setExtensionForm({ ...extensionForm, departmentConfirm: e.target.value })
                  }
                  placeholder="请填写受访部门确认信息"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowExtensionModal(false)}
                disabled={submittingExtension}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleExtensionSubmit}
                disabled={submittingExtension}
              >
                {submittingExtension ? '提交中...' : '提交申请'}
              </Button>
            </div>
          </div>
        </div>
      )}
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

function getTimelineActionLabel(action: string): string {
  const labels: Record<string, string> = {
    appointment_created: '创建预约',
    visitor_info_updated: '补充访客信息',
    entered_park: '车辆入园',
    exited_park: '车辆离园',
    detained: '标记滞留',
    extension_requested: '提交延期申请',
    extension_approved: '延期申请已批准',
    extension_rejected: '延期申请已拒绝',
    appointment_cancelled: '取消预约',
    appointment_expired: '预约过期',
  };
  return labels[action] || action;
}

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    employee: '员工',
    visitor: '访客',
    guard: '门岗',
    security_supervisor: '安保主管',
    system: '系统',
  };
  return labels[role] || role;
}
