import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Car, Users, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { Input } from '@/components/Input.js';
import { StatusBadge } from '@/components/StatusBadge.js';
import { appointmentApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { Appointment } from '@shared/types';

export function VisitorEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    plateNumber: '',
    companionCount: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasOriginalPlate, setHasOriginalPlate] = useState(false);

  useEffect(() => {
    if (id) {
      loadAppointment();
    }
  }, [id]);

  const loadAppointment = async () => {
    setLoading(true);
    try {
      const apt = await appointmentApi.get(id!);
      setAppointment(apt);
      setFormData({
        plateNumber: apt.plateNumber || '',
        companionCount: apt.companionCount || 0,
      });
      setHasOriginalPlate(!!apt.plateNumber);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value.toUpperCase(),
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.plateNumber.trim()) {
      newErrors.plateNumber = '请输入车牌号';
    }
    if (formData.companionCount < 0) {
      newErrors.companionCount = '同行人数不能为负数';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      await appointmentApi.updateVisitorInfo(id!, formData);
      alert('信息保存成功！');
      navigate('/visitor');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout role="visitor">
        <div className="p-12 text-center text-gray-500">加载中...</div>
      </Layout>
    );
  }

  if (!appointment) {
    return (
      <Layout role="visitor">
        <div className="p-12 text-center text-gray-500">预约不存在</div>
      </Layout>
    );
  }

  const isEditable = appointment.status === 'pending_info' || appointment.status === 'pending_entry';

  return (
    <Layout role="visitor">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/visitor')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {hasOriginalPlate ? '修改车辆信息' : '补充车辆信息'}
              </h1>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="text-gray-500 mt-1">
              {hasOriginalPlate ? '修改后系统将重新核验黑名单' : '请填写您的车辆信息以便顺利入园'}
            </p>
          </div>
        </div>

        <Card>
          <Card.Header>
            <h2 className="text-lg font-semibold text-gray-900">预约信息</h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <InfoRow label="受访部门" value={appointment.department} />
              <InfoRow label="受访员工" value={appointment.employeeName} />
              <InfoRow label="来访事由" value={appointment.purpose} />
              <InfoRow label="访客姓名" value={appointment.visitorName} />
              <div className="col-span-2">
                <InfoRow
                  label="预约时间"
                  value={`${formatDateTime(appointment.startTime)} - ${formatDateTime(appointment.endTime)}`}
                />
              </div>
            </div>
          </Card.Body>
        </Card>

        {hasOriginalPlate && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">修改车牌提示</p>
              <p className="text-sm text-amber-700 mt-1">
                当前车牌：{formatPlateNumber(appointment.plateNumber)}
                <br />
                修改车牌后，系统将保留原车牌的审计记录，并重新进行黑名单校验。
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <Card.Header>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Car size={18} className="text-emerald-600" />
                车辆信息
              </h2>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <Input
                  label="车牌号"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleChange}
                  error={errors.plateNumber}
                  placeholder="请输入车牌号，如：粤B12345"
                  disabled={!isEditable}
                  className="text-lg font-mono tracking-wider"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    同行人数（不含驾驶员）
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          companionCount: Math.max(0, prev.companionCount - 1),
                        }))
                      }
                      disabled={!isEditable}
                      className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      name="companionCount"
                      value={formData.companionCount}
                      onChange={handleChange}
                      disabled={!isEditable}
                      className="w-20 px-3 py-2 text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          companionCount: prev.companionCount + 1,
                        }))
                      }
                      disabled={!isEditable}
                      className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                    >
                      +
                    </button>
                    <span className="text-sm text-gray-500 ml-2">
                      <Users size={16} className="inline mr-1" />
                      共 {formData.companionCount + 1} 人
                    </span>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {isEditable && (
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/visitor')}
              >
                取消
              </Button>
              <Button type="submit" variant="success" disabled={saving}>
                <Save size={16} className="mr-2" />
                {saving ? '保存中...' : '保存信息'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
