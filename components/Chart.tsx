'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export default function Chart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{
          top: 5,
          right: 0,
          left: -20,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis 
          dataKey="date" 
          stroke="#94a3b8" 
          tick={{fill: '#94a3b8', fontSize: 12}} 
          tickLine={false} 
          axisLine={false}
        />
        <YAxis 
          stroke="#94a3b8" 
          tick={{fill: '#94a3b8', fontSize: 12}} 
          tickLine={false} 
          axisLine={false}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'rgba(20, 24, 30, 0.9)', 
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#fff'
          }} 
          itemStyle={{ color: '#fff' }}
        />
        <Area 
          type="monotone" 
          dataKey="views" 
          stroke="#3b82f6" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorViews)" 
          animationDuration={1500}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
