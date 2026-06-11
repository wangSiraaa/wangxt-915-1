import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogIn, LogOut, Users, Clock, Search } from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { Button } from '@/components/Button.js';
import { recordApi } from '@/services/api.js';
import { formatPlateNumber } from '@/lib/utils.js';

export function GuardHome() {
  const navigate = useNavigate();
  const [plateNumber, setPlateNumber] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    entered: 0,
    exited: 0,
    inPark: 0,
  });
  const [todayRecords, setTodayRecords] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsData, records] = await Promise.all([
        recordApi.getTodayStats(),
        recordApi.listToday(),
      ]);
      setStats(statsData);
      setTodayRecords(records.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = (type: 'entry' | 'exit') => {
    if (!plateNumber.trim()) {
      alert('请输入车牌号');
      return;
    }
    navigate(`/guard/verify?type=${type}&plate=${plateNumber.toUpperCase()}`);
  };

  return (
    <Layout role="guard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">入园核验</h1>
          <p className="text-gray-500 mt-1">输入车牌号进行入离园核验</p>
        </div>

        <Card className="bg-gradient-to-br from-blue-50 to-slate-50">
          <Card.Body className="py-8">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Shield size={32} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">车辆核验</h2>
                <p className="text-gray-500 mt-1">请输入车牌号进行核验</p>
              </div>

              <div className="relative mb-6">
                <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify('entry')}
                  placeholder="请输入车牌号，如：粤B12345"
                  className="w-full pl-12 pr-4 py-4 text-xl font-mono tracking-wider border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  variant="success"
                  onClick={() => handleVerify('entry')}
                  className="py-4 text-base"
                >
                  <LogIn size={20} className="mr-2" />
                  入园核验
                </Button>
                <Button
                  size="lg"
                  variant="primary"
                  onClick={() => handleVerify('exit')}
                  className="py-4 text-base"
                >
                  <LogOut size={20} className="mr-2" />
                  离园登记
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="今日总访客"
            value={stats.total}
            icon={<Users size={24} />}
            color="blue"
          />
          <StatCard
            label="今日入园"
            value={stats.entered}
            icon={<LogIn size={24} />}
            color="emerald"
          />
          <StatCard
            label="今日离园"
            value={stats.exited}
            icon={<LogOut size={24} />}
            color="slate"
          />
          <StatCard
            label="在园车辆"
            value={stats.inPark}
            icon={<Clock size={24} />}
            color="amber"
          />
        </div>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">最近通行记录</h2>
              <button
                onClick={() => navigate('/guard/records')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                查看全部 →
              </button>
            </div>
          </Card.Header>
          <div className="divide-y divide-gray-50">
            {todayRecords.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无通行记录</div>
            ) : (
              todayRecords.map((record) => (
                <div
                  key={record.id}
                  className="px-6 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        record.status === 'entered'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {record.status === 'entered' ? (
                        <LogIn size={18} />
                      ) : (
                        <LogOut size={18} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 font-mono">
                        {formatPlateNumber(record.plateNumber)}
                      </p>
                      <p className="text-sm text-gray-500">{record.visitorName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">
                      {record.status === 'entered' ? '入园' : '离园'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {record.entryTime
                        ? new Date(record.entryTime).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>
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
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-50 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
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
