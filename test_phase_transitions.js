// Test script to verify phase transitions
const buildReturnPhases = (
  horizonMonths,
  profile,
  paymentPeriod,
  customRates
) => {
  const defaultRates = {
    Conservative: { high: 0.04, mid: 0.03, low: 0.02 },
    Balanced: { high: 0.06, mid: 0.05, low: 0.03 },
    Growth: { high: 0.08, mid: 0.07, low: 0.05 },
  };

  const rates = customRates || defaultRates[profile];
  const years = horizonMonths / 12;

  // If goal carries a payment period (e.g. mortgage, tuition)
  if (paymentPeriod) {
    if (years <= 3) {
      // Short-term payment goals: Conservative throughout accumulation
      return [
        { length: horizonMonths, rate: rates.low },
        { length: paymentPeriod * 12, rate: 0.02 }
      ];
    } else if (years <= 7) {
      // Medium-term payment goals: Growth then conservative before target
      const conservative = 24; // Last 2 years before target
      return [
        { length: horizonMonths - conservative, rate: rates.high },
        { length: conservative, rate: rates.low },
        { length: paymentPeriod * 12, rate: 0.02 }
      ];
    } else {
      // Long-term payment goals: Use three-phase strategy like regular goals
      const high = Math.floor(horizonMonths * 0.72);
      const mid = Math.floor(horizonMonths * 0.16);
      const low = horizonMonths - high - mid;
      return [
        { length: high, rate: rates.high },
        { length: mid, rate: rates.mid },
        { length: low, rate: rates.low },
        { length: paymentPeriod * 12, rate: 0.02 }
      ];
    }
  }

  if (years <= 3) {
    return [{ length: horizonMonths, rate: rates.low }];
  }
  if (years <= 7) {
    const mid = 24; // last 2 years low-risk
    return [
      { length: horizonMonths - mid, rate: rates.high },
      { length: mid, rate: rates.low },
    ];
  }
  // >7 years: high → mid → low according to 72/16/12 rule
  const high = Math.floor(horizonMonths * 0.72);
  const mid = Math.floor(horizonMonths * 0.16);
  const low = horizonMonths - high - mid;
  return [
    { length: high, rate: rates.high },
    { length: mid, rate: rates.mid },
    { length: low, rate: rates.low },
  ];
};

// Test scenarios
console.log("=== TESTING PHASE TRANSITIONS ===\n");

// Scenario 1: Long-term regular goal (10 years, should have 3 phases)
console.log("1. Regular 10-year goal (Growth profile):");
const longTermGoal = buildReturnPhases(120, 'Growth');
longTermGoal.forEach((phase, index) => {
  console.log(`   Phase ${index + 1}: ${phase.length} months at ${(phase.rate * 100).toFixed(1)}%`);
});
console.log("");

// Scenario 2: Medium-term payment period goal (6 years accumulation + 4 years payment)
console.log("2. Education goal (6 years accumulation + 4 years payment, Growth profile):");
const educationGoal = buildReturnPhases(72, 'Growth', 4);
educationGoal.forEach((phase, index) => {
  const phaseName = index === educationGoal.length - 1 ? 'Drawdown' : 
                   index === 0 ? 'Growth Accumulation' : 'Conservative Pre-Target';
  console.log(`   Phase ${index + 1} (${phaseName}): ${phase.length} months at ${(phase.rate * 100).toFixed(1)}%`);
});
console.log("");

// Scenario 3: Short-term regular goal (2 years, should have 1 phase)
console.log("3. Short-term goal (2 years, Balanced profile):");
const shortTermGoal = buildReturnPhases(24, 'Balanced');
shortTermGoal.forEach((phase, index) => {
  console.log(`   Phase ${index + 1}: ${phase.length} months at ${(phase.rate * 100).toFixed(1)}%`);
});
console.log("");

// Function to simulate getting rate info at different months
const getGoalRateInfo = (goal, monthIndex) => {
  let currentPhase = 0;
  let monthsElapsed = 0;
  
  for (let i = 0; i < goal.returnPhases.length; i++) {
    const phase = goal.returnPhases[i];
    if (monthIndex >= monthsElapsed && monthIndex < monthsElapsed + phase.length) {
      currentPhase = i;
      break;
    }
    monthsElapsed += phase.length;
  }
  
  const phase = goal.returnPhases[currentPhase];
  return {
    phase: currentPhase,
    rate: phase.rate
  };
};

// Test monthly transitions for education goal
console.log("4. Monthly rate transitions for education goal:");
const testGoal = {
  returnPhases: educationGoal,
  horizonMonths: 72,
  paymentPeriod: 4
};

// Show key months where transitions occur
const keyMonths = [0, 23, 24, 47, 48, 71, 72, 95, 96];
keyMonths.forEach(month => {
  const info = getGoalRateInfo(testGoal, month);
  console.log(`   Month ${month}: Phase ${info.phase + 1}, Rate ${(info.rate * 100).toFixed(1)}%`);
}); 