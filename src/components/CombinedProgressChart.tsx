import React, { useState, useMemo } from 'react';
import { addMonths, format } from 'date-fns';
import { usePlanner } from '../context/PlannerContext';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/calculations';
import { TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Line,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

interface DataPoint {
  month: Date;
  contribution: number;
  balance: number;
}

const CombinedProgressChart: React.FC = () => {
  const { state } = usePlanner();
  const { currency } = useCurrency();
  const startDate = new Date();

  const { points, target } = useMemo(() => {
    if (state.allocations.length === 0) {
      return { points: [], target: 0 };
    }

    const maxMonths = Math.max(
      ...state.allocations.map(a => a.monthlyAllocations.length)
    );

    const pts: DataPoint[] = [];
    for (let i = 0; i < maxMonths; i++) {
      let contribSum = 0;
      let balanceSum = 0;
      state.allocations.forEach(a => {
        contribSum += a.monthlyAllocations[i] ?? 0;
        const bal = a.runningBalances[i] ?? a.runningBalances[a.runningBalances.length - 1] ?? 0;
        balanceSum += bal;
      });
      pts.push({
        month: addMonths(startDate, i),
        contribution: contribSum,
        balance: balanceSum
      });
    }

    const totalTarget = state.allocations.reduce((s, a) => s + a.goal.amount, 0);
    return { points: pts, target: totalTarget };
  }, [state.allocations]);

  const getYDomain = () => {
    const maxBalance = Math.max(...points.map(p => p.balance), target);
    return [0, maxBalance * 1.1];
  };

  const formatXAxis = (date: Date) => format(date, 'MMM yy');

  // Custom Tooltip Component for theme awareness
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label) {
      return (
        <div className="bg-theme-card border border-theme rounded-lg shadow-theme-lg p-4">
          <p className="font-semibold text-theme-primary mb-3">
            {format(label as Date, 'MMMM yyyy')}
          </p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-theme-secondary flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}:
                </span>
                <span className="font-semibold text-theme-primary">
                  {formatCurrency(entry.value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Legend Component for theme awareness
  const CustomLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center items-center gap-6 pb-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-theme-secondary font-medium">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-theme overflow-hidden mt-12 shadow-theme-lg bg-theme-card">
      <div className="bg-gradient-to-r from-green-500/10 to-orange-500/10 border-b border-theme p-6 rounded-t-xl">
        <h3 className="heading-h3-sm text-theme-primary mb-2">
          Financial Goals Progress Overview
        </h3>
        <p className="text-theme-secondary">Track all your financial goals in one comprehensive view</p>
      </div>
      
      <div className="p-6 bg-theme-card">
        <div className="w-full bg-theme-card rounded-xl shadow-theme border border-theme p-4" style={{ height: '400px' }}>
          <ResponsiveContainer>
            <ComposedChart data={points} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--wk-border)" 
                opacity={0.6} 
              />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatXAxis} 
                minTickGap={30} 
                tick={{ fill: 'var(--wk-text-muted)' }} 
                stroke="var(--wk-border)" 
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value as number, currency)}
                tick={{ fill: 'var(--wk-text-muted)' }}
                scale="linear"
                domain={getYDomain()}
                stroke="var(--wk-border)"
              />
              <ReferenceLine
                y={target}
                stroke="var(--wk-text-muted)"
                strokeDasharray="3 3"
                label={{ 
                  value: 'All goals total', 
                  position: 'right', 
                  fill: 'var(--wk-text-muted)', 
                  fontSize: 12 
                }}
              />
              <Bar 
                dataKey="contribution" 
                fill="#10B981" 
                name="Monthly Contributions" 
                barSize={6} 
                radius={[2,2,0,0]} 
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#059669" 
                strokeWidth={2.5} 
                dot={false} 
                name="Total Balance Growth" 
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
              />
              <Legend
                content={<CustomLegend />}
                verticalAlign="top"
                height={50}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CombinedProgressChart; 