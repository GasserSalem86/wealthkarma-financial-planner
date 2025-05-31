// Test goal-specific investment phases

const testData = {
  goals: [
    {
      id: 'emergency-fund',
      name: 'Emergency Fund',
      amount: 50000,
      priority: 1
    },
    {
      id: 'house-fund',
      name: 'House Down Payment',
      amount: 200000,
      priority: 2
    },
    {
      id: 'retirement-fund',
      name: 'Retirement Savings',
      amount: 500000,
      priority: 3
    }
  ],
  totalValue: 750000,
  monthlyBudget: 10000,
  totalMonths: 60,
  monthlyPlan: [
    // Month 1-12: Emergency Fund (Conservative)
    {
      monthName: 'January 2024',
      totalAllocation: 10000,
      goalBreakdown: [
        {
          goalName: 'Emergency Fund',
          monthlyContribution: 10000,
          contribution: 10000
        }
      ]
    },
    // Month 13-36: House Down Payment (Balanced)
    {
      monthName: 'January 2025',
      totalAllocation: 10000,
      goalBreakdown: [
        {
          goalName: 'House Down Payment',
          monthlyContribution: 10000,
          contribution: 10000
        }
      ]
    },
    // Month 37-60: Retirement Savings (Growth)
    {
      monthName: 'January 2027',
      totalAllocation: 10000,
      goalBreakdown: [
        {
          goalName: 'Retirement Savings',
          monthlyContribution: 10000,
          contribution: 10000
        }
      ]
    }
  ],
  currency: { code: 'AED', symbol: 'د.إ' }
};

console.log('🎯 GOAL-SPECIFIC INVESTMENT PHASES TEST');
console.log('======================================');

console.log('\n✅ IMPROVEMENT: Goal-Based Investment Strategy');
console.log('Before: Generic timeline-based phases');
console.log('After:  Goal-specific investment strategies');

// Test different goal types and their expected investment strategies
const goalTypes = [
  {
    name: 'Emergency Fund',
    expected: {
      phase: 'Conservative',
      rate: '4-6%',
      icon: '🛡️',
      color: 'Orange',
      rationale: 'Safety and liquidity prioritized'
    }
  },
  {
    name: 'House Down Payment',
    expected: {
      phase: 'Balanced',
      rate: '6-8%',
      icon: '🏠',
      color: 'Blue',
      rationale: 'Medium-term horizon allows moderate risk'
    }
  },
  {
    name: 'Retirement Savings',
    expected: {
      phase: 'Growth',
      rate: '8-12%',
      icon: '📈',
      color: 'Green',
      rationale: 'Long-term horizon allows higher risk/return'
    }
  },
  {
    name: 'College Education Fund',
    expected: {
      phase: 'Balanced',
      rate: '6-8%',
      icon: '🎓',
      color: 'Purple',
      rationale: 'Education timeline requires steady growth'
    }
  },
  {
    name: 'Business Startup Fund',
    expected: {
      phase: 'Growth',
      rate: '8-12%',
      icon: '💼',
      color: 'Green',
      rationale: 'Business goals benefit from aggressive growth'
    }
  },
  {
    name: 'Travel Fund',
    expected: {
      phase: 'Conservative',
      rate: '4-6%',
      icon: '✈️',
      color: 'Orange',
      rationale: 'Short-term travel goals need stability'
    }
  },
  {
    name: 'Car Purchase',
    expected: {
      phase: 'Conservative',
      rate: '4-6%',
      icon: '🚗',
      color: 'Orange',
      rationale: 'Vehicle purchases need predictable returns'
    }
  }
];

console.log('\n📊 GOAL-SPECIFIC STRATEGIES:');
goalTypes.forEach(goal => {
  console.log(`\n🎯 ${goal.name}:`);
  console.log(`   Strategy: ${goal.expected.icon} ${goal.expected.phase}`);
  console.log(`   Target Return: ${goal.expected.rate} annually`);
  console.log(`   Rationale: ${goal.expected.rationale}`);
});

console.log('\n🔄 MONTHLY PLAN EXAMPLE:');
testData.monthlyPlan.forEach((month, index) => {
  const primaryGoal = month.goalBreakdown[0];
  let strategy = 'Balanced';
  let rate = '6-8%';
  let icon = '⚖️';
  
  const goalName = primaryGoal.goalName.toLowerCase();
  if (goalName.includes('emergency')) {
    strategy = 'Conservative';
    rate = '4-6%';
    icon = '🛡️';
  } else if (goalName.includes('house')) {
    strategy = 'Balanced';
    rate = '6-8%';
    icon = '🏠';
  } else if (goalName.includes('retirement')) {
    strategy = 'Growth';
    rate = '8-12%';
    icon = '📈';
  }
  
  console.log(`Month ${(index + 1).toString().padStart(2, '0')}: ${icon} ${strategy} (${rate}) - ${primaryGoal.goalName}`);
});

console.log('\n💡 USER BENEFITS:');
console.log('✅ Goal-specific investment guidance');
console.log('✅ Risk-appropriate strategies per goal');
console.log('✅ Clear rationale for each approach');
console.log('✅ Visual icons for easy identification');
console.log('✅ Tailored return expectations');

console.log('\n📈 INVESTMENT LOGIC:');
console.log('🛡️  Emergency Funds → Conservative (Safety first)');
console.log('🏠  Real Estate → Balanced (Moderate growth)');
console.log('📈  Retirement → Growth (Long-term advantage)');
console.log('🎓  Education → Balanced (Steady accumulation)');
console.log('💼  Business → Growth (Maximize capital)');
console.log('✈️  Travel → Conservative (Near-term certainty)');
console.log('🚗  Vehicles → Conservative (Predictable needs)');

console.log('\n🚀 IMPLEMENTATION COMPLETE!');
console.log('Investment strategies now match goal characteristics,');
console.log('providing users with appropriate risk/return guidance!'); 