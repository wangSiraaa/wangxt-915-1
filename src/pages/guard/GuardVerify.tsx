import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  LogIn,
  LogOut,
  User,
  Users,
  Building,
  FileText,
  Shield,
} from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { StatusBadge } from '@/components/StatusBadge.js';
import { verifyApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { Appointment, RejectType } from '@shared/types';

export function GuardVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = (searchParams.get('type') as 'entry' | 'exit') || 'entry';
  const initialPlate = searchParams.get('plate') || '';

  const [plateNumber, setPlateNumber] = useState(initialPlate);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    appointment?: Appointment;
    rejectType?: RejectType;
    rejectReason?: string;
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (initialPlate) {
      handleVerify();
    }
  }, []);

  const handleVerify = async () => {
    if (!plateNumber.trim()) return;

    setVerifying(true);
    setResult(null);
    try {
      const data = await verifyApi.entry(plateNumber, false);
      setResult(data);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirm = async () => {
    if (!result?.success || !result.appointment) return;

    setLoading(true);
    try {
      if (type === 'entry') {
        await verifyApi.entry(plateNumber, true);
      } else {
        await verifyApi.exit(plateNumber, true);
      }
      setConfirmed(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getRejectIcon = (rejectType?: RejectType) => {
    switch (rejectType) {
      case 'blacklist':
        return <Shield size={64} className="text-red-500" />;
      case 'expired':
        return <Clock size={64} className="text-orange-500" />;
      case 'not_started':
        return <Clock size={64} className="text-amber-500" />;
      case 'duplicate_entry':
        return <AlertTriangle size={64} className="text-red-500" />;
      default:
        return <XCircle size={64} className="text-gray-400" />;
    }
  };

  const getRejectTitle = (rejectType?: RejectType) => {
    switch (rejectType) {
      case 'blacklist':
        return '黑名单车辆';
      case 'expired':
        return '预约已过期';
      case 'not_started':
        return '未到预约时间';
      case 'duplicate_entry':
        return '车辆已在园内';
      case 'not_found':
        return '未找到预约';
      default:
        return '核验未通过';
    }
  };

  return (
    <Layout role="guard">
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/guard')}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {type === 'entry' ? '入园核验' : '离园登记'}
            </h1>
            <p className="text-gray-500 mt-1">输入车牌号进行核验</p>
          </div>
        </div>

        <Card>
          <Card.Body className="py-6">
            <div className="flex gap-3">
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="请输入车牌号"
                className="flex-1 px-4 py-3 text-lg font-mono tracking-wider border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button size="lg" onClick={handleVerify} disabled={verifying}>
                {verifying ? '核验中...' : '核验'}
              </Button>
            </div>
          </Card.Body>
        </Card>

        {result && !confirmed && (
          <div
            className={`rounded-2xl overflow-hidden ${
              result.success
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="p-8 text-center">
              {result.success ? (
                <>
                  <CheckCircle2 size={72} className="mx-auto text-emerald-500 mb-4" />
                  <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                    核验通过
                  </h2>
                  <p className="text-emerald-700">
                    {type === 'entry' ? '可以入园' : '可以离园'}
                  </p>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex justify-center">
                    {getRejectIcon(result.rejectType)}
                  </div>
                  <h2 className="text-2xl font-bold text-red-900 mb-2">
                    {getRejectTitle(result.rejectType)}
                  </h2>
                  <p className="text-red-700">{result.rejectReason}</p>
                </>
              )}
            </div>
          </div>
        )}

        {result?.appointment && (
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">预约信息</h2>
                <StatusBadge status={result.appointment!.status} />
              </div>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={<LogIn size={16} className="text-blue-500" />}
                  label="车牌号"
                  value={formatPlateNumber(result.appointment.plateNumber)}
                />
                <InfoItem
                  icon={<User size={16} className="text-blue-500" />}
                  label="访客姓名"
                  value={result.appointment.visitorName}
                />
                <InfoItem
                  icon={<Building size={16} className="text-blue-500" />}
                  label="受访部门"
                  value={result.appointment.department}
                />
                <InfoItem
                  icon={<User size={16} className="text-blue-500" />}
                  label="受访员工"
                  value={result.appointment.employeeName}
                />
                <InfoItem
                  icon={<FileText size={16} className="text-blue-500" />}
                  label="来访事由"
                  value={result.appointment.purpose}
                />
                <InfoItem
                  icon={<Users size={16} className="text-blue-500" />}
                  label="同行人数"
                  value={`${result.appointment.companionCount + 1} 人`}
                />
                <div className="col-span-2">
                  <InfoItem
                    icon={<Clock size={16} className="text-blue-500" />}
                    label="预约时间"
                    value={`${formatDateTime(result.appointment.startTime)} - ${formatDateTime(result.appointment.endTime)}`}
                  />
                </div>
              </div>
            </Card.Body>
            {result.success && !confirmed && (
              <Card.Footer>
                <div className="flex justify-end">
                  <Button
                    variant={type === 'entry' ? 'success' : 'primary'}
                    size="lg"
                    onClick={handleConfirm}
                    disabled={loading}
                  >
                    {type === 'entry' ? (
                      <>
                        <LogIn size={18} className="mr-2" />
                        {loading ? '登记中...' : '确认入园'}
                      </>
                    ) : (
                      <>
                        <LogOut size={18} className="mr-2" />
                        {loading ? '登记中...' : '确认离园'}
                      </>
                    )}
                  </Button>
                </div>
              </Card.Footer>
            )}
          </Card>
        )}

        {confirmed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
            <CheckCircle2 size={72} className="mx-auto text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">
              {type === 'entry' ? '入园登记成功' : '离园登记成功'}
            </h2>
            <p className="text-emerald-700 mb-6">
              {type === 'entry'
                ? '访客车辆已成功登记入园'
                : '访客车辆已成功登记离园'}
            </p>
            <Button onClick={() => navigate('/guard')}>返回首页</Button>
          </div>
        )}
      </div>
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
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
