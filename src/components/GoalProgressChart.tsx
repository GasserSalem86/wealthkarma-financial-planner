import React from 'react';
import { format, addMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, ComposedChart, Legend, CartesianGrid, ReferenceLine, Bar } from 'recharts';
import { Goal } from '../types/plannerTypes';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../utils/calculations';

interface GoalProgressChartProps {
  goal: Goal;
  monthlyAllocations: number[];
  runningBalances: number[];
}

interface DataPoint {
  monthIndex: number;
  monthLabel: string;
  year: number;
  contribution: number;
  balance: number;
  formattedDate: string;
}

const GoalProgressChart: React.FC<GoalProgressChartProps> = ({ goal, monthlyAllocations, runningBalances }) => {
  const { currency } = useCurrency();
  const startDate = new Date();

  // Calculate proper data points with better processing
  const createDataPoints = (): DataPoint[] => {
    const points: DataPoint[] = [];
    const maxMonths = Math.min(monthlyAllocations.length, runningBalances.length, goal.horizonMonths);
    
    for (let i = 0; i < maxMonths; i++) {
      const currentDate = addMonths(startDate, i);
      const contribution = monthlyAllocations[i] || 0;
      let balance = runningBalances[i] || 0;
      
      // Ensure balance never decreases unrealistically for retirement savings
      if (i > 0 && balance < points[i - 1].balance && contribution > 0) {
        balance = points[i - 1].balance + contribution;
      }
      
      points.push({
        monthIndex: i,
        monthLabel: format(currentDate, 'MMM yy'),
        year: currentDate.getFullYear(),
        contribution,
        balance: Math.max(0, balance),
        formattedDate: format(currentDate, 'MMMM yyyy')
      });
    }
    
    return points;
  };

  const dataPoints = createDataPoints();

  // Early return if no valid data to prevent sizing issues
  if (!dataPoints.length || dataPoints.length < 2) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <h3 className="heading-h4-sm text-theme-primary">
            Track Your Progress to {goal.name}
          </h3>
        </div>
        <div className="w-full bg-theme-card rounded-xl shadow-theme border border-theme p-6 text-center">
          <p className="text-theme-secondary">Chart will appear once your goal timeline is calculated.</p>
        </div>
      </div>
    );
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return `${value.toFixed(0)}`;
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && label !== undefined) {
      const data = payload[0]?.payload;
      if (!data) return null;
      
      return (
        <div className="bg-theme-card border border-theme rounded-lg shadow-theme-lg p-4">
          <p className="font-semibold text-theme-primary mb-3">{data.formattedDate}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-theme-secondary">Monthly Contribution:</span>
              <span className="font-semibold text-theme-primary">
                {formatCurrency(data.contribution, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-theme-secondary">Total Saved:</span>
              <span className="font-semibold text-theme-success">
                {formatCurrency(data.balance, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-theme-secondary">Target Goal:</span>
              <span className="font-medium text-theme-primary">
                {formatCurrency(goal.amount, currency)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-theme">
              <span className="text-theme-secondary">Progress:</span>
              <span className="font-bold text-theme-success">
                {((data.balance / goal.amount) * 100).toFixed(1)}%
              </span>
            </div>
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

  const maxValue = Math.max(...runningBalances, goal.amount);
  const yAxisDomain = [0, maxValue * 1.1];

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <h3 className="heading-h4-sm text-theme-primary">
          Track Your Progress to {goal.name}
        </h3>
      </div>
      
      {/* Fixed container with explicit dimensions and aspect ratio */}
      <div className="w-full bg-theme-card rounded-xl shadow-theme border border-theme p-4">
        <div style={{ width: '100%', height: '400px', minHeight: '400px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={300}>
          <ComposedChart 
            data={dataPoints} 
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="var(--wk-border)" 
              opacity={0.6} 
            />
            <XAxis
              dataKey="monthLabel"
              tick={{ fill: 'var(--wk-text-muted)', fontSize: 12 }}
              stroke="var(--wk-border)"
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: 'var(--wk-text-muted)', fontSize: 12 }}
              domain={yAxisDomain}
              stroke="var(--wk-border)"
            />
            
            {/* Goal line */}
            <ReferenceLine
              y={goal.amount}
              stroke="var(--wk-text-muted)"
              strokeDasharray="5 5"
              label={{
                value: 'Target Goal',
                position: 'top',
                fill: 'var(--wk-text-muted)',
                fontSize: 12
              }}
            />
            
            {/* Monthly contributions as bars */}
            <Bar 
              dataKey="contribution" 
              fill="#10B981" 
              name="Monthly Contributions" 
              barSize={6} 
              radius={[2,2,0,0]} 
            />
            
            {/* Area under the curve for total savings */}
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#059669"
              strokeWidth={3}
              fill="url(#colorBalance)"
              name="Total Saved"
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
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GoalProgressChart;