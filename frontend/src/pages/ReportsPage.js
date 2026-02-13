import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import toast from 'react-hot-toast';
import { FiBarChart2, FiDownload, FiPieChart, FiTrendingUp } from 'react-icons/fi';

const ReportsPage = () => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState('demographics');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/exports/reports', { params: { type: reportType } });
      setReportData(res.data);
      toast.success('Report generated!');
    } catch (e) { toast.error('Failed to generate report'); }
    finally { setLoading(false); }
  };

  const downloadJSON = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `report_${reportType}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const reportTypes = [
    { value: 'demographics', label: 'Demographics', icon: FiPieChart, desc: 'Nationality, gender, asylum status distribution' },
    { value: 'funding', label: 'Funding', icon: FiTrendingUp, desc: 'Revenue, payment trends, donation types' },
    { value: 'utilization', label: 'Service Utilization', icon: FiBarChart2, desc: 'Services, events, referrals usage' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-black neon-text flex items-center gap-2"><FiBarChart2 /> {t('nav.reports')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map(rt => (
          <button key={rt.value} onClick={() => setReportType(rt.value)}
            className={`glass-card p-6 text-left transition-all hover:border-neon-cyan/30 ${reportType === rt.value ? 'border-neon-pink/50 bg-neon-pink/5' : ''}`}>
            <rt.icon size={24} className={reportType === rt.value ? 'text-neon-pink' : 'text-gray-400'} />
            <h3 className="font-bold mt-3">{rt.label}</h3>
            <p className="text-xs text-gray-400 mt-1">{rt.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={generateReport} disabled={loading} className="neon-button text-sm flex items-center gap-2">
          {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FiBarChart2 />}
          Generate Report
        </button>
        {reportData && (
          <button onClick={downloadJSON} className="neon-button-cyan text-sm flex items-center gap-2 px-4 py-2 rounded-xl font-bold">
            <FiDownload /> Download JSON
          </button>
        )}
      </div>

      {reportData && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-neon-cyan">Report: {reportData.type}</h3>
            <span className="text-xs text-gray-400">Generated: {new Date(reportData.generatedAt).toLocaleString('de-AT')}</span>
          </div>

          {reportData.type === 'demographics' && reportData.data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-bold text-neon-pink mb-2">By Nationality</h4>
                <div className="space-y-1">
                  {(reportData.data.byNationality || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-tekosin-card/50">
                      <span>{item.nationality || 'Unknown'}</span>
                      <span className="font-bold text-neon-cyan">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neon-pink mb-2">By Gender</h4>
                <div className="space-y-1">
                  {(reportData.data.byGender || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-tekosin-card/50">
                      <span>{item.gender || 'Unknown'}</span>
                      <span className="font-bold text-neon-cyan">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neon-pink mb-2">By Asylum Status</h4>
                <div className="space-y-1">
                  {(reportData.data.byAsylumStatus || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-tekosin-card/50">
                      <span>{item.asylumStatus || 'Unknown'}</span>
                      <span className="font-bold text-neon-cyan">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {reportData.type === 'funding' && reportData.data && (
            <div className="space-y-4">
              <div className="stat-card">
                <p className="text-xs text-gray-400">Total Revenue</p>
                <p className="text-3xl font-black text-neon-green">€{Number(reportData.data.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neon-pink mb-2">By Payment Type</h4>
                <div className="space-y-1">
                  {(reportData.data.byType || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-tekosin-card/50">
                      <span>{item.type}</span>
                      <span className="font-bold text-neon-green">€{Number(item.total || 0).toLocaleString()} ({item.count} payments)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {reportData.type === 'utilization' && reportData.data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['services', 'events', 'referrals'].map(key => (
                <div key={key}>
                  <h4 className="text-sm font-bold text-neon-pink mb-2 capitalize">{key}</h4>
                  <div className="space-y-1">
                    {(reportData.data[key] || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm p-2 rounded hover:bg-tekosin-card/50">
                        <span>{item.type}</span>
                        <span className="font-bold text-neon-cyan">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
