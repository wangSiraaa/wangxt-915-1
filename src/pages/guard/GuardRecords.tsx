import { useState, useEffect } from 'react';
import { Search, LogIn, LogOut, Filter, Calendar } from 'lucide-react';
import { Layout } from '@/components/Layout.js';
import { Card } from '@/components/Card.js';
import { recordApi } from '@/services/api.js';
import { formatDateTime, formatPlateNumber } from '@/lib/utils.js';
import type { VisitRecord } from '@shared/types';

export function GuardRecords() {
  const [records, setRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'entered' | 'exited'>('all');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    loadRecords();
  }, [filterStatus, selectedDate]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params: { date?: string; status?: string } = {};
      if (selectedDate) params.date = selectedDate;
      if (filterStatus !== 'all') params.status = filterStatus;

      const data = await recordApi.list(params);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      record.plateNumber.toLowerCase().includes(term) ||
      record.visitorName.toLowerCase().includes(term)
    );
  });

  return (
    <Layout role="guard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">通行记录</h1>
          <p className="text-gray-500 mt-1">查看所有车辆入离园记录</p>
        </div>

        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">记录列表</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索车牌、访客..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  {[
                    { key: 'all', label: '全部' },
                    { key: 'entered', label: '入园' },
                    { key: 'exited', label: '离园' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setFilterStatus(item.key as any)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        filterStatus === item.key
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card.Header>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    车牌号
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    访客姓名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    入园时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    离园时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    关联预约
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      加载中...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      暂无记录
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-gray-900">
                            {formatPlateNumber(record.plateNumber)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {record.visitorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.status === 'entered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {record.status === 'entered' ? (
                            <LogIn size={12} />
                          ) : (
                            <LogOut size={12} />
                          )}
                          {record.status === 'entered' ? '已入园' : '已离园'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDateTime(record.entryTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.exitTime ? formatDateTime(record.exitTime) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.appointmentId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
