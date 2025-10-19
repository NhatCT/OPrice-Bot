import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

interface ChartData {
    name: string;
    [key: string]: string | number;
}

interface AnalysisChartProps {
    chart: {
        type: 'bar';
        title: string;
        data: ChartData[];
    };
    theme: 'light' | 'dark';
}

const formatValue = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.0', '')} Tỷ`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')} Tr`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace('.0', '')} K`;
    return value.toLocaleString('vi-VN');
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg">
          <p className="font-bold text-slate-800 dark:text-slate-100">{label}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">{`${payload[0].name}: ${Number(payload[0].value).toLocaleString('vi-VN')} VND`}</p>
        </div>
      );
    }
    return null;
};

export const AnalysisChart: React.FC<AnalysisChartProps> = ({ chart, theme }) => {
    const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

    // Add a defensive check to ensure chart.data is an array before rendering.
    if (!Array.isArray(chart.data)) {
        console.error("Invalid chart data: expected an array but got:", chart.data);
        return (
            <div className="my-4 p-4 text-center text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <p className="font-semibold">Lỗi Dữ liệu Biểu đồ</p>
                <p className="text-sm">Không thể hiển thị biểu đồ do dữ liệu trả về không hợp lệ.</p>
            </div>
        );
    }

    if (chart.type === 'bar') {
        const dataKey = Object.keys(chart.data[0] || {}).find(key => key !== 'name') || 'value';
        
        return (
            <div className="my-4">
                <h4 className="text-center font-semibold text-slate-700 dark:text-slate-200 mb-3">{chart.title}</h4>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chart.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} barGap={10}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="name" stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke={tickColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatValue} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === 'dark' ? 'rgba(148, 163, 184, 0.1)' : 'rgba(100, 116, 139, 0.1)' }} />
                            <Bar dataKey={dataKey} name="Giá trị" barSize={40} radius={[4, 4, 0, 0]}>
                                 {chart.data.map((entry, idx) => (
                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    return <div>Loại biểu đồ không được hỗ trợ.</div>;
};