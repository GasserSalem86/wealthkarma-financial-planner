import ExcelJS from 'exceljs';
import { formatCurrency } from '../utils/calculations';
import { Currency } from '../types/currencyTypes';

export interface ExcelData {
  goals: any[];
  totalValue: number;
  monthlyBudget: number;
  allocations: any[];
  totalMonths: number;
  monthlyPlan: any[];
  currency: Currency;
  userProfile?: {
    name?: string;
    email?: string;
    country?: string;
    nationality?: string;
    monthlyIncome?: number;
  };
}

export class ExcelService {
  async generateExcelTracker(data: ExcelData): Promise<Blob> {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Set workbook properties
      workbook.creator = 'WealthKarma.com';
      workbook.lastModifiedBy = 'WealthKarma AI Financial Planner';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.lastPrinted = new Date();
      workbook.title = 'GCC Expat Financial Planning Tracker';
      workbook.description = 'Interactive tracker for expatriate financial goals';
      
      // Set calculation properties to ensure formulas calculate automatically
      workbook.calcProperties = {
        fullCalcOnLoad: true
      };
      
      // Create all worksheets
      await this.createDashboardSheet(workbook, data);
      await this.createMonthlyTrackerSheet(workbook, data);
      await this.createInvestmentPhasesSheet(workbook, data);
      await this.createCalculatorToolsSheet(workbook, data);
      
      // Generate buffer and return as blob
      const buffer = await workbook.xlsx.writeBuffer();
      return new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
    } catch (error) {
      console.error('Excel generation error:', error);
      throw new Error('Failed to generate Excel tracker: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  private async createDashboardSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('📊 Dashboard', {
      headerFooter: { firstHeader: 'WealthKarma - AI Financial Planning Dashboard' }
    });

    // Header section
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '🎯 GCC Expat Financial Planning Dashboard';
    titleCell.font = { size: 20, bold: true, color: { argb: 'FF059669' } }; // Increased from 18
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30; // Add row height
    
    // User info section
    worksheet.getCell('A3').value = 'Name:';
    worksheet.getCell('A3').font = { size: 12, bold: true }; // Added font size
    worksheet.getCell('B3').value = data.userProfile?.name || 'User';
    worksheet.getCell('B3').font = { size: 12 };
    
    // Add email if available
    if (data.userProfile?.email) {
      worksheet.getCell('D3').value = 'Email:';
      worksheet.getCell('D3').font = { size: 12, bold: true };
      worksheet.getCell('E3').value = data.userProfile.email;
      worksheet.getCell('E3').font = { size: 12 };
    }
    
    worksheet.getCell('A4').value = 'Country:';
    worksheet.getCell('A4').font = { size: 12, bold: true };
    worksheet.getCell('B4').value = data.userProfile?.country || 'UAE';
    worksheet.getCell('B4').font = { size: 12 };
    
    // Add nationality if available
    if (data.userProfile?.nationality) {
      worksheet.getCell('D4').value = 'Nationality:';
      worksheet.getCell('D4').font = { size: 12, bold: true };
      worksheet.getCell('E4').value = data.userProfile.nationality;
      worksheet.getCell('E4').font = { size: 12 };
    }
    
    worksheet.getCell('A5').value = 'Currency:';
    worksheet.getCell('A5').font = { size: 12, bold: true };
    worksheet.getCell('B5').value = data.currency.code;
    worksheet.getCell('B5').font = { size: 12 };
    
    // Add monthly income if available
    if (data.userProfile?.monthlyIncome) {
      worksheet.getCell('D5').value = 'Monthly Income:';
      worksheet.getCell('D5').font = { size: 12, bold: true };
      worksheet.getCell('E5').value = formatCurrency(data.userProfile.monthlyIncome, data.currency);
      worksheet.getCell('E5').font = { size: 12 };
    }
    
    worksheet.getCell('A6').value = 'Generated:';
    worksheet.getCell('A6').font = { size: 12, bold: true };
    worksheet.getCell('B6').value = new Date().toLocaleDateString();
    worksheet.getCell('B6').font = { size: 12 };

    // Key metrics section
    worksheet.getCell('A8').value = '📈 Key Metrics';
    worksheet.getCell('A8').font = { size: 16, bold: true }; // Increased from 14
    
    worksheet.getCell('A10').value = 'Total Target Amount:';
    worksheet.getCell('A10').font = { size: 12, bold: true };
    worksheet.getCell('B10').value = formatCurrency(data.totalValue, data.currency);
    worksheet.getCell('B10').font = { size: 12 };
    worksheet.getCell('A11').value = 'Monthly Budget:';
    worksheet.getCell('A11').font = { size: 12, bold: true };
    worksheet.getCell('B11').value = formatCurrency(data.monthlyBudget, data.currency);
    worksheet.getCell('B11').font = { size: 12 };
    worksheet.getCell('A12').value = 'Timeline:';
    worksheet.getCell('A12').font = { size: 12, bold: true };
    worksheet.getCell('B12').value = `${data.totalMonths} months (${Math.round(data.totalMonths / 12)} years)`;
    worksheet.getCell('B12').font = { size: 12 };
    worksheet.getCell('A13').value = 'Number of Goals:';
    worksheet.getCell('A13').font = { size: 12, bold: true };
    worksheet.getCell('B13').value = data.goals.length;
    worksheet.getCell('B13').font = { size: 12 };

    // Goals summary table
    worksheet.getCell('A15').value = '🎯 Goals Summary';
    worksheet.getCell('A15').font = { size: 16, bold: true }; // Increased from 14
    
    // Headers
    const headers = ['Goal Name', 'Target Amount', 'Monthly Contrib.', 'Timeline', 'Progress', 'Status'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(17, index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 12 }; // Added size
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F3FF' } };
    });
    worksheet.getRow(17).height = 25; // Add header row height

    // Goal data
    data.goals.forEach((goal, index) => {
      const allocation = data.allocations.find(a => a.goal?.id === goal.id);
      const rowIndex = 18 + index;
      
      worksheet.getCell(rowIndex, 1).value = goal.name;
      worksheet.getCell(rowIndex, 1).font = { size: 11 };
      worksheet.getCell(rowIndex, 2).value = formatCurrency(goal.amount, data.currency);
      worksheet.getCell(rowIndex, 2).font = { size: 11 };
      worksheet.getCell(rowIndex, 3).value = formatCurrency(allocation?.requiredPMT || 0, data.currency);
      worksheet.getCell(rowIndex, 3).font = { size: 11 };
      worksheet.getCell(rowIndex, 4).value = `${goal.horizonMonths || 60} months`;
      worksheet.getCell(rowIndex, 4).font = { size: 11 };
      
      // Dynamic progress calculation - sum actual contributions from Monthly Tracker
      const progressCell = worksheet.getCell(rowIndex, 5);
      const goalColIndex = 4 + (index * 5) + 4; // Balance column for this goal in Monthly Tracker
      const goalBalanceColumn = this.getColumnLetter(goalColIndex);
      progressCell.value = { 
        formula: `IFERROR(IF('📅 Monthly Tracker'!${goalBalanceColumn}9>0,'📅 Monthly Tracker'!${goalBalanceColumn}9/${goal.amount},0),"0%")` 
      };
      progressCell.numFmt = '0.0%';
      progressCell.font = { size: 11 };
      
      // Dynamic status based on progress and target timeline
      const statusCell = worksheet.getCell(rowIndex, 6);
      statusCell.value = { 
        formula: `IF(E${rowIndex}=0,"🔄 Not Started",IF(E${rowIndex}>=1,"✅ Completed",IF(E${rowIndex}>=0.1,"📈 In Progress","⚠️ Getting Started")))` 
      };
      statusCell.font = { size: 11 };
      
      worksheet.getRow(rowIndex).height = 22; // Add row height
    });

    // Apply styling with increased column widths
    worksheet.getColumn('A').width = 25; // Increased from 20
    worksheet.getColumn('B').width = 18; // Increased from 15
    worksheet.getColumn('C').width = 18; // Increased from 15
    worksheet.getColumn('D').width = 15; // Increased from 12
    worksheet.getColumn('E').width = 12; // Increased from 10
    worksheet.getColumn('F').width = 18; // Increased from 15
    
    // Add overall progress section
    const progressStartRow = 18 + data.goals.length + 2;
    worksheet.getCell(progressStartRow, 1).value = '📊 Overall Progress Summary';
    worksheet.getCell(progressStartRow, 1).font = { size: 16, bold: true };
    worksheet.getRow(progressStartRow).height = 25;
    
    // Total saved across all goals
    worksheet.getCell(progressStartRow + 2, 1).value = 'Total Saved:';
    worksheet.getCell(progressStartRow + 2, 1).font = { size: 12, bold: true };
    const totalSavedCell = worksheet.getCell(progressStartRow + 2, 2);
    const goalBalanceFormulas = data.goals.map((_, index) => {
      const goalColIndex = 4 + (index * 5) + 4; // Balance column for this goal
      const goalBalanceColumn = this.getColumnLetter(goalColIndex);
      return `'📅 Monthly Tracker'!${goalBalanceColumn}9`;
    }).join('+');
    totalSavedCell.value = { formula: `IFERROR(${goalBalanceFormulas},0)` };
    totalSavedCell.numFmt = '"$"#,##0.00';
    totalSavedCell.font = { size: 12, bold: true };
    
    // Overall progress percentage
    worksheet.getCell(progressStartRow + 3, 1).value = 'Overall Progress:';
    worksheet.getCell(progressStartRow + 3, 1).font = { size: 12, bold: true };
    const overallProgressCell = worksheet.getCell(progressStartRow + 3, 2);
    overallProgressCell.value = { formula: `IFERROR(B${progressStartRow + 2}/${data.totalValue},0)` };
    overallProgressCell.numFmt = '0.0%';
    overallProgressCell.font = { size: 12, bold: true };
    
    // Next milestone
    worksheet.getCell(progressStartRow + 4, 1).value = 'Next Milestone:';
    worksheet.getCell(progressStartRow + 4, 1).font = { size: 12, bold: true };
    worksheet.getCell(progressStartRow + 4, 2).value = 'Check Monthly Tracker for current month actions';
    worksheet.getCell(progressStartRow + 4, 2).font = { size: 12 };
    
    // Last updated
    worksheet.getCell(progressStartRow + 5, 1).value = 'Last Updated:';
    worksheet.getCell(progressStartRow + 5, 1).font = { size: 12, bold: true };
    worksheet.getCell(progressStartRow + 5, 2).value = { formula: 'NOW()' };
    worksheet.getCell(progressStartRow + 5, 2).numFmt = 'dd/mm/yyyy hh:mm';
    worksheet.getCell(progressStartRow + 5, 2).font = { size: 12 };
    
    // Set row heights for progress section
    for (let i = progressStartRow + 2; i <= progressStartRow + 5; i++) {
      worksheet.getRow(i).height = 22;
    }
  }

  private async createGoalsConfigSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('⚙️ Goals Config');

    // Header
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '⚙️ Goals Configuration & Planning';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF059669' } }; // Increased from 16
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 28; // Add row height

    // Instructions
    worksheet.getCell('A3').value = 'Instructions: Modify the values below to adjust your financial plan. All other sheets will update automatically.';
    worksheet.getCell('A3').font = { italic: true, color: { argb: 'FF666666' }, size: 11 }; // Added size
    worksheet.getRow(3).height = 20;

    // Add explanatory note about Monthly Contribution
    worksheet.getCell('A4').value = '📝 Note: "Monthly Contribution" shows your current plan allocation - modify your budget/goals to change this.';
    worksheet.getCell('A4').font = { italic: true, color: { argb: 'FF996633' }, size: 10 };
    worksheet.getRow(4).height = 18;

    // Configuration table headers
    const configHeaders = [
      'Goal Name', 'Target Amount', 'Current Amount', 'Priority', 
      'Timeline (Months)', 'Risk Tolerance', 'Goal Type', 'Monthly Contribution', 'Status'
    ];
    
    configHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(6, index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 12 }; // Added size
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F3FF' } };
    });
    worksheet.getRow(6).height = 25; // Add header row height

    // Populate with current goals
    data.goals.forEach((goal, index) => {
      const allocation = data.allocations.find(a => a.goal?.id === goal.id);
      const rowIndex = 7 + index;
      
      worksheet.getCell(rowIndex, 1).value = goal.name;
      worksheet.getCell(rowIndex, 1).font = { size: 11 };
      worksheet.getCell(rowIndex, 2).value = goal.amount;
      worksheet.getCell(rowIndex, 2).font = { size: 11 };
      worksheet.getCell(rowIndex, 3).value = 0; // User will input current amount
      worksheet.getCell(rowIndex, 3).font = { size: 11 };
      worksheet.getCell(rowIndex, 4).value = goal.priority || index + 1;
      worksheet.getCell(rowIndex, 4).font = { size: 11 };
      worksheet.getCell(rowIndex, 5).value = goal.horizonMonths || 60;
      worksheet.getCell(rowIndex, 5).font = { size: 11 };
      worksheet.getCell(rowIndex, 6).value = goal.riskTolerance || 'Medium';
      worksheet.getCell(rowIndex, 6).font = { size: 11 };
      worksheet.getCell(rowIndex, 7).value = this.getGoalType(goal);
      worksheet.getCell(rowIndex, 7).font = { size: 11 };
      worksheet.getCell(rowIndex, 8).value = allocation?.requiredPMT || 0;
      worksheet.getCell(rowIndex, 8).font = { italic: true, color: { argb: 'FF666666' }, size: 11 };
      worksheet.getCell(rowIndex, 9).value = 'Active';
      worksheet.getCell(rowIndex, 9).font = { size: 11 };
      
      worksheet.getRow(rowIndex).height = 22; // Add row height
    });

    // Add validation and formulas
    this.addGoalValidation(worksheet, data.goals.length);
    
    // Format columns with increased widths
    worksheet.getColumn('A').width = 25; // Increased from 20
    worksheet.getColumn('B').width = 18; // Increased from 15
    worksheet.getColumn('C').width = 18; // Increased from 15
    worksheet.getColumn('D').width = 12; // Increased from 10
    worksheet.getColumn('E').width = 18; // Increased from 15
    worksheet.getColumn('F').width = 18; // Increased from 15
    worksheet.getColumn('G').width = 18; // Increased from 15
    worksheet.getColumn('H').width = 22; // Increased from 18
    worksheet.getColumn('I').width = 15; // Increased from 12
  }

  private async createMonthlyTrackerSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('📅 Monthly Tracker');

    // Header
    worksheet.mergeCells('A1:Q1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '📅 Monthly Progress Tracker with Rate Guidance';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF059669' } }; // Increased from 16
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30; // Add row height

    // Instructions
    worksheet.mergeCells('A3:Q3');
    const instructionCell = worksheet.getCell('A3');
    instructionCell.value = `💡 Update the "Actual" columns monthly with your real contributions and balances. Yellow cells indicate input fields. This tracker covers ${data.totalMonths} months (${Math.round(data.totalMonths / 12)} years).`;
    instructionCell.font = { italic: true, color: { argb: 'FF666666' }, size: 11 }; // Added size
    instructionCell.alignment = { horizontal: 'center' };
    worksheet.getRow(3).height = 25; // Add row height

    // Rate legend
    worksheet.getCell('A5').value = '🎯 Rate Guide:';
    worksheet.getCell('A5').font = { bold: true, size: 12 }; // Already 12
    worksheet.getCell('B5').value = '🟢 2-3% = Emergency/Savings';
    worksheet.getCell('B5').font = { size: 11 }; // Added font size
    worksheet.getCell('F5').value = '🟡 4-6% = Conservative Funds';
    worksheet.getCell('F5').font = { size: 11 };
    worksheet.getCell('J5').value = '🟠 7-8% = Balanced/Growth';
    worksheet.getCell('J5').font = { size: 11 };
    worksheet.getCell('N5').value = '🔴 8%+ = Aggressive Growth';
    worksheet.getCell('N5').font = { size: 11 };
    worksheet.getRow(5).height = 22; // Add row height

    // Create dynamic monthly tracking headers
    const baseHeaders = ['Month', 'Date', 'Total Budget'];
    let headerColIndex = 4;
    
    // Add headers for each goal with rate information
    data.goals.forEach(goal => {
      const goalName = goal.name.length > 12 ? goal.name.substring(0, 12) + '...' : goal.name;
      
      // Planned contribution
      worksheet.getCell(7, headerColIndex).value = `${goalName}`;
      worksheet.getCell(8, headerColIndex).value = 'Planned ($)';
      worksheet.getCell(7, headerColIndex).font = { bold: true, size: 11 }; // Increased from 10
      worksheet.getCell(8, headerColIndex).font = { bold: true, size: 10 }; // Increased from 9
      worksheet.getCell(7, headerColIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCE5FF' } };
      worksheet.getCell(8, headerColIndex).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCE5FF' } };
      
      // Actual contribution (user input)
      worksheet.getCell(8, headerColIndex + 1).value = 'Actual ($)';
      worksheet.getCell(8, headerColIndex + 1).font = { bold: true, size: 10 }; // Increased from 9
      worksheet.getCell(8, headerColIndex + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } }; // Yellow for input
      
      // Target rate
      worksheet.getCell(8, headerColIndex + 2).value = 'Target Rate';
      worksheet.getCell(8, headerColIndex + 2).font = { bold: true, size: 10 }; // Increased from 9
      worksheet.getCell(8, headerColIndex + 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5FFE5' } };
      
      // Investment phase
      worksheet.getCell(8, headerColIndex + 3).value = 'Phase';
      worksheet.getCell(8, headerColIndex + 3).font = { bold: true, size: 10 }; // Increased from 9
      worksheet.getCell(8, headerColIndex + 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5E5' } };
      
      // Running balance
      worksheet.getCell(8, headerColIndex + 4).value = 'Balance';
      worksheet.getCell(8, headerColIndex + 4).font = { bold: true, size: 10 }; // Increased from 9
      worksheet.getCell(8, headerColIndex + 4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEEE5' } };
      
      headerColIndex += 5;
    });

    // Add summary columns
    worksheet.getCell(7, headerColIndex).value = 'Monthly Summary';
    worksheet.getCell(7, headerColIndex).font = { bold: true, size: 11 }; // Added font size
    worksheet.getCell(8, headerColIndex).value = 'Total Actual';
    worksheet.getCell(8, headerColIndex).font = { bold: true, size: 10 };
    worksheet.getCell(8, headerColIndex + 1).value = 'Variance';
    worksheet.getCell(8, headerColIndex + 1).font = { bold: true, size: 10 };
    worksheet.getCell(8, headerColIndex + 2).value = 'Status';
    worksheet.getCell(8, headerColIndex + 2).font = { bold: true, size: 10 };
    
    [headerColIndex, headerColIndex + 1, headerColIndex + 2].forEach(col => {
      worksheet.getCell(7, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF99FF' } };
      worksheet.getCell(8, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF99FF' } };
    });
    
    // Set header row heights
    worksheet.getRow(7).height = 22;
    worksheet.getRow(8).height = 20;

    // Generate monthly data rows
    const startDate = new Date();
    
    for (let monthIndex = 0; monthIndex < data.totalMonths; monthIndex++) {
      const monthDate = new Date(startDate);
      monthDate.setMonth(startDate.getMonth() + monthIndex);
      const rowIndex = 9 + monthIndex;
      
      // Month info
      worksheet.getCell(rowIndex, 1).value = monthIndex + 1;
      worksheet.getCell(rowIndex, 1).font = { size: 10 };
      worksheet.getCell(rowIndex, 2).value = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      worksheet.getCell(rowIndex, 2).font = { size: 10 };
      worksheet.getCell(rowIndex, 3).value = data.monthlyBudget;
      worksheet.getCell(rowIndex, 3).font = { size: 10 };
      
      let dataColIndex = 4;
      
      // Add data for each goal
      data.goals.forEach(goal => {
        const allocation = data.allocations.find(a => a.goal?.id === goal.id);
        const plannedAmount = allocation?.monthlyAllocations[monthIndex] || 0;
        const runningBalance = allocation?.runningBalances[monthIndex] || 0;
        
        // Get rate and phase info for this month
        const rateInfo = this.getGoalRateAndPhase(goal, monthIndex);
        
        // Planned contribution
        worksheet.getCell(rowIndex, dataColIndex).value = plannedAmount;
        worksheet.getCell(rowIndex, dataColIndex).numFmt = '$#,##0.00';
        worksheet.getCell(rowIndex, dataColIndex).font = { size: 10 };
        
        // Actual contribution (user input cell) - populate with 0 so formulas work
        worksheet.getCell(rowIndex, dataColIndex + 1).value = 0;
        worksheet.getCell(rowIndex, dataColIndex + 1).numFmt = '$#,##0.00';
        worksheet.getCell(rowIndex, dataColIndex + 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
        worksheet.getCell(rowIndex, dataColIndex + 1).font = { size: 10 };
        
        // Target rate
        worksheet.getCell(rowIndex, dataColIndex + 2).value = (rateInfo.targetRate * 100).toFixed(1) + '%';
        worksheet.getCell(rowIndex, dataColIndex + 2).font = { size: 10 }; // Increased from 9
        
        // Investment phase
        worksheet.getCell(rowIndex, dataColIndex + 3).value = rateInfo.phase;
        worksheet.getCell(rowIndex, dataColIndex + 3).font = { size: 10 }; // Increased from 9 (was previously 8)
        
        // Running balance (calculated)
        if (monthIndex === 0) {
          const balanceCell = worksheet.getCell(rowIndex, dataColIndex + 4);
          balanceCell.value = { formula: `${this.getColumnLetter(dataColIndex + 1)}${rowIndex}` };
        } else {
          const prevRow = rowIndex - 1;
          const balanceCell = worksheet.getCell(rowIndex, dataColIndex + 4);
          balanceCell.value = { 
            formula: `${this.getColumnLetter(dataColIndex + 4)}${prevRow}*(1+${(rateInfo.targetRate/12).toFixed(6)})+${this.getColumnLetter(dataColIndex + 1)}${rowIndex}` 
          };
        }
        worksheet.getCell(rowIndex, dataColIndex + 4).numFmt = '$#,##0.00';
        worksheet.getCell(rowIndex, dataColIndex + 4).font = { size: 10 };
        
        // Rate change indicator
        if (monthIndex > 0) {
          const prevRateInfo = this.getGoalRateAndPhase(goal, monthIndex - 1);
          if (Math.abs(prevRateInfo.targetRate - rateInfo.targetRate) > 0.001) {
            worksheet.getCell(rowIndex, dataColIndex + 2).value = (rateInfo.targetRate * 100).toFixed(1) + '% 🔄';
            worksheet.getCell(rowIndex, dataColIndex + 2).font = { size: 10, color: { argb: 'FFFF6600' } };
          }
          if (prevRateInfo.phase !== rateInfo.phase) {
            worksheet.getCell(rowIndex, dataColIndex + 3).font = { size: 10, color: { argb: 'FFFF6600' } }; // Increased from 9
          }
        }
        
        dataColIndex += 5;
      });
      
      // Summary calculations
      const totalActualFormula = data.goals.map((_, index) => {
        const goalColIndex = 4 + (index * 5) + 1; // Actual contribution column for each goal
        return `${this.getColumnLetter(goalColIndex)}${rowIndex}`;
      }).join('+');
      
      const totalActualCell = worksheet.getCell(rowIndex, dataColIndex);
      totalActualCell.value = { formula: totalActualFormula };
      totalActualCell.numFmt = '$#,##0.00';
      totalActualCell.font = { size: 10 };
      
      // Variance calculation
      const varianceCell = worksheet.getCell(rowIndex, dataColIndex + 1);
      varianceCell.value = { formula: `${this.getColumnLetter(dataColIndex)}${rowIndex}-C${rowIndex}` };
      varianceCell.numFmt = '$#,##0.00';
      varianceCell.font = { size: 10 };
      
      // Status calculation
      const statusCell = worksheet.getCell(rowIndex, dataColIndex + 2);
      statusCell.value = { 
        formula: `IF(${this.getColumnLetter(dataColIndex + 1)}${rowIndex}>=0,"✅ On Track",IF(${this.getColumnLetter(dataColIndex + 1)}${rowIndex}>=-${data.monthlyBudget * 0.1},"⚠️ Close","🚨 Behind"))` 
      };
      statusCell.font = { size: 10 };
      
      // Set row height for data rows
      worksheet.getRow(rowIndex).height = 18;
    }

    // Add conditional formatting
    this.addMonthlyTrackerConditionalFormatting(worksheet, data);
    
    // Set column widths - increased for better readability
    worksheet.getColumn('A').width = 10; // Increased from 8
    worksheet.getColumn('B').width = 14; // Increased from 12
    worksheet.getColumn('C').width = 14; // Increased from 12
    
    let widthColIndex = 4;
    data.goals.forEach(() => {
      for (let i = 0; i < 5; i++) {
        worksheet.getColumn(widthColIndex + i).width = i === 3 ? 12 : 14; // Phase column 12, others 14 (increased from 10/12)
      }
      widthColIndex += 5;
    });
  }

  private async createInvestmentPhasesSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('📈 Investment Phases');

    // Header
    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '📈 Investment Phases & Rate Strategy Guide';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF059669' } }; // Increased from 16
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    let currentRow = 3;

    // For each goal, create a phase timeline
    data.goals.forEach((goal, goalIndex) => {
      // Goal header
      worksheet.getCell(currentRow, 1).value = `🎯 ${goal.name}`;
      worksheet.getCell(currentRow, 1).font = { size: 16, bold: true, color: { argb: 'FF059669' } }; // Increased from 14
      worksheet.getRow(currentRow).height = 25;
      currentRow++;

      // Goal details
      worksheet.getCell(currentRow, 1).value = 'Target Amount:';
      worksheet.getCell(currentRow, 1).font = { size: 12, bold: true };
      worksheet.getCell(currentRow, 2).value = formatCurrency(goal.amount, data.currency);
      worksheet.getCell(currentRow, 2).font = { size: 12 };
      worksheet.getCell(currentRow, 3).value = 'Timeline:';
      worksheet.getCell(currentRow, 3).font = { size: 12, bold: true };
      worksheet.getCell(currentRow, 4).value = `${goal.horizonMonths || 60} months`;
      worksheet.getCell(currentRow, 4).font = { size: 12 };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      // Phase timeline table
      const phaseHeaders = ['Phase', 'Duration', 'Target Rate', 'Investment Type', 'Risk Level', 'Rate Change Trigger', 'Action Required'];
      phaseHeaders.forEach((header, index) => {
        const cell = worksheet.getCell(currentRow, index + 1);
        cell.value = header;
        cell.font = { bold: true, size: 12 }; // Increased from 10
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F3FF' } };
      });
      worksheet.getRow(currentRow).height = 25;
      currentRow++;

      // Generate phases for this goal
      const phases = this.generateGoalPhases(goal);
      phases.forEach((phase, phaseIndex) => {
        worksheet.getCell(currentRow, 1).value = phase.name;
        worksheet.getCell(currentRow, 1).font = { size: 11 };
        worksheet.getCell(currentRow, 2).value = `${phase.startMonth}-${phase.endMonth} months`;
        worksheet.getCell(currentRow, 2).font = { size: 11 };
        worksheet.getCell(currentRow, 3).value = `${(phase.rate * 100).toFixed(1)}%`;
        worksheet.getCell(currentRow, 3).font = { size: 11 };
        worksheet.getCell(currentRow, 4).value = phase.investmentType;
        worksheet.getCell(currentRow, 4).font = { size: 11 };
        worksheet.getCell(currentRow, 5).value = phase.riskLevel;
        worksheet.getCell(currentRow, 5).font = { size: 11 };
        worksheet.getCell(currentRow, 6).value = phase.trigger;
        worksheet.getCell(currentRow, 6).font = { size: 11 };
        worksheet.getCell(currentRow, 7).value = phase.action;
        worksheet.getCell(currentRow, 7).font = { size: 11 };
        
        // Color code by risk level
        const riskColors = {
          'Very Low': 'FFE5FFE5',
          'Low': 'FFFFFF99',
          'Medium': 'FFFFCC99',
          'Medium-High': 'FFFF9999',
          'High': 'FFFF6666'
        };
        
        const bgColor = riskColors[phase.riskLevel as keyof typeof riskColors] || 'FFFFFFFF';
        for (let col = 1; col <= 7; col++) {
          worksheet.getCell(currentRow, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        }
        
        worksheet.getRow(currentRow).height = 22;
        currentRow++;
      });

      // Rate change calendar for this goal
      currentRow++;
      worksheet.getCell(currentRow, 1).value = '📅 Rate Change Calendar:';
      worksheet.getCell(currentRow, 1).font = { bold: true, size: 14 }; // Increased from 12
      worksheet.getRow(currentRow).height = 22;
      currentRow++;

      const rateChanges = this.getGoalRateChanges(goal);
      rateChanges.forEach(change => {
        worksheet.getCell(currentRow, 1).value = `Month ${change.month}:`;
        worksheet.getCell(currentRow, 1).font = { size: 11 };
        worksheet.getCell(currentRow, 2).value = change.description;
        worksheet.getCell(currentRow, 2).font = { size: 11 };
        worksheet.getCell(currentRow, 3).value = change.action;
        worksheet.getCell(currentRow, 3).font = { size: 11 };
        if (change.isImportant) {
          worksheet.getCell(currentRow, 1).font = { bold: true, color: { argb: 'FFFF6600' }, size: 11 };
          worksheet.getCell(currentRow, 2).font = { color: { argb: 'FFFF6600' }, size: 11 };
        }
        worksheet.getRow(currentRow).height = 20;
        currentRow++;
      });

      currentRow += 2; // Space between goals
    });

    // Set column widths - increased for better readability
    worksheet.columns.forEach((column, index) => {
      if (index === 0) column.width = 25; // Increased from 20
      else if (index === 1) column.width = 18; // Increased from 15
      else if (index === 2) column.width = 15; // Increased from 12
      else if (index === 3) column.width = 22; // Increased from 18
      else if (index === 4) column.width = 15; // Increased from 12
      else if (index === 5) column.width = 25; // Increased from 20
      else column.width = 30; // Increased from 25
    });
  }

  private getGoalType(goal: any): string {
    // First check if goal has category property (most reliable)
    if (goal.category) {
      switch (goal.category) {
        case 'Education': return 'Education';
        case 'Travel': return 'Travel'; 
        case 'Gift': return 'Gift';
        case 'Home': return 'Real Estate';
        case 'Retirement': return 'Retirement';
        default: return goal.category;
      }
    }
    
    // Fallback to name parsing for backwards compatibility
    const name = goal.name.toLowerCase();
    if (name.includes('emergency') || goal.id === 'emergency-fund') return 'Emergency Fund';
    if (name.includes('house') || name.includes('home')) return 'Real Estate';
    if (name.includes('retirement')) return 'Retirement';
    if (name.includes('education')) return 'Education';
    if (name.includes('travel')) return 'Travel';
    if (name.includes('car')) return 'Vehicle';
    return 'General';
  }

  private getGoalPhaseInfo(goal: any) {
    const timeline = goal.horizonMonths || 60;
    const years = Math.round(timeline / 12);
    
    if (timeline <= 12) {
      return {
        currentPhase: 'Preservation',
        riskLevel: 'Very Low',
        targetReturn: '2-4%',
        duration: `${timeline} months`,
        nextPhase: 'Maintenance',
        action: 'High-yield savings'
      };
    } else if (timeline <= 36) {
      return {
        currentPhase: 'Conservative Growth',
        riskLevel: 'Low',
        targetReturn: '4-6%',
        duration: `${Math.min(24, timeline)} months`,
        nextPhase: 'Preservation',
        action: 'Bonds, term deposits'
      };
    } else {
      return {
        currentPhase: 'Growth Accumulation',
        riskLevel: 'Medium-High',
        targetReturn: '7-10%',
        duration: `${Math.min(timeline - 12, 24)} months`,
        nextPhase: 'Conservative Growth',
        action: 'Diversified investing'
      };
    }
  }

  private addGoalValidation(worksheet: ExcelJS.Worksheet, goalCount: number) {
    // Add data validation for risk tolerance
    for (let i = 0; i < goalCount; i++) {
      const goalRowIndex = 7 + i; // Updated to match new row positioning
      
      // Risk tolerance validation (column F = 6)
      const riskCell = worksheet.getCell(goalRowIndex, 6);
      riskCell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Very Low,Low,Medium,Medium-High,High"']
      };
      
      // Goal type validation (column G = 7)
      const goalTypeCell = worksheet.getCell(goalRowIndex, 7);
      goalTypeCell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Emergency Fund,Education,Travel,Gift,Real Estate,Retirement,Vehicle,General"']
      };
      
      // Status validation (column I = 9)
      const statusCell = worksheet.getCell(goalRowIndex, 9);
      statusCell.dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"Active,Paused,Completed,Cancelled"']
      };
    }
  }

  private async createBankComparisonSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('🏦 Banks & Platforms');

    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '🏦 GCC Banks & Investment Platforms Comparison';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF059669' } }; // Increased from 16
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30; // Add row height

    // UAE Banks section
    worksheet.getCell('A3').value = '🇦🇪 UAE Banks - Savings Accounts';
    worksheet.getCell('A3').font = { size: 16, bold: true }; // Increased from 14
    worksheet.getRow(3).height = 25;

    const bankHeaders = ['Bank Name', 'Account Type', 'Interest Rate', 'Min Balance', 'Features', 'Online Banking', 'Recommended For'];
    bankHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(4, index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 12 }; // Added size
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F3FF' } };
    });
    worksheet.getRow(4).height = 25;

    const uaeBanks = [
      ['Emirates NBD', 'Savings Account', '0.25%', 'AED 3,000', 'Free transfers, ATM access', 'Yes', 'Emergency Fund'],
      ['ADCB', 'Premium Savings', '1.75%', 'AED 25,000', 'Higher rates, wealth management', 'Yes', 'Large Emergency Fund'],
      ['FAB', 'Flexi Saver', '0.50%', 'AED 1,000', 'Flexible access, low minimum', 'Yes', 'Short-term goals'],
      ['Mashreq Bank', 'Savings Plus', '2.25%', 'AED 50,000', 'Tiered interest rates', 'Yes', 'Conservative investment'],
      ['RAKBANK', 'Smart Saver', '1.50%', 'AED 10,000', 'Digital banking focus', 'Yes', 'Tech-savvy savers']
    ];

    uaeBanks.forEach((bank, index) => {
      bank.forEach((value, colIndex) => {
        const cell = worksheet.getCell(5 + index, colIndex + 1);
        cell.value = value;
        cell.font = { size: 11 }; // Added font size
      });
      worksheet.getRow(5 + index).height = 20;
    });

    // Investment platforms section
    worksheet.getCell('A12').value = '📈 Investment Platforms';
    worksheet.getCell('A12').font = { size: 16, bold: true }; // Increased from 14
    worksheet.getRow(12).height = 25;

    const platformHeaders = ['Platform', 'Min Investment', 'Fees', 'Asset Classes', 'UAE Regulated', 'Mobile App', 'Best For'];
    platformHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(13, index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 12 }; // Added size
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE5E5' } };
    });
    worksheet.getRow(13).height = 25;

    const platforms = [
      ['Sarwa', 'USD 500', '0.85% annual', 'ETFs, Bonds', 'Yes', 'Yes', 'Beginner investors'],
      ['Interactive Brokers', 'USD 0', 'From $1 per trade', 'Stocks, ETFs, Options', 'Yes', 'Yes', 'Advanced traders'],
      ['Charles Schwab', 'USD 1,000', 'No commission ETFs', 'US markets focus', 'No', 'Yes', 'US market exposure'],
      ['Emirates Investment Bank', 'AED 10,000', '1.5% annual', 'Local & regional', 'Yes', 'Limited', 'Regional exposure']
    ];

    platforms.forEach((platform, index) => {
      platform.forEach((value, colIndex) => {
        const cell = worksheet.getCell(14 + index, colIndex + 1);
        cell.value = value;
        cell.font = { size: 11 }; // Added font size
      });
      worksheet.getRow(14 + index).height = 20;
    });

    // Set column widths - increased for better readability
    worksheet.columns.forEach(column => {
      column.width = 22; // Increased from 18
    });
  }

  private async createScenarioModelingSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('🔮 Scenario Modeling');

    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '🔮 What-If Scenario Modeling';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF059669' } }; // Increased from 16
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30; // Add row height

    // Instructions
    worksheet.getCell('A3').value = '💡 Instructions: Change the yellow input values to see how different scenarios affect your financial plan.';
    worksheet.getCell('A3').font = { italic: true, color: { argb: 'FF666666' }, size: 11 }; // Added size
    worksheet.mergeCells('A3:H3');
    worksheet.getRow(3).height = 20;

    // Add examples section
    worksheet.getCell('A4').value = '📋 Example Scenarios: Try these common what-if situations...';
    worksheet.getCell('A4').font = { italic: true, color: { argb: 'FF0066CC' }, size: 11 };
    worksheet.mergeCells('A4:H4');
    worksheet.getRow(4).height = 18;

    // Scenario inputs section
    worksheet.getCell('A5').value = '⚙️ Scenario Variables (Change these values)';
    worksheet.getCell('A5').font = { size: 14, bold: true };
    worksheet.getRow(5).height = 22;

    // Base scenario inputs with increased font sizes
    worksheet.getCell('A7').value = 'Current Monthly Budget:';
    worksheet.getCell('A7').font = { size: 11, bold: true };
    worksheet.getCell('B7').value = data.monthlyBudget;
    worksheet.getCell('B7').font = { size: 11 };
    worksheet.getCell('B7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDDDDDD' } }; // Read-only grey
    worksheet.getCell('C7').value = '(Your current plan - read only)';
    worksheet.getCell('C7').font = { italic: true, size: 10, color: { argb: 'FF666666' } };

    worksheet.getCell('A8').value = 'New Monthly Budget:';
    worksheet.getCell('A8').font = { size: 11, bold: true };
    worksheet.getCell('B8').value = data.monthlyBudget;
    worksheet.getCell('B8').font = { size: 11 };
    worksheet.getCell('B8').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } }; // Editable yellow
    worksheet.getCell('C8').value = 'Try: +20% for promotion, -30% for downsizing';
    worksheet.getCell('C8').font = { italic: true, size: 10, color: { argb: 'FF0066CC' } };

    worksheet.getCell('A9').value = 'Salary Increase (%):';
    worksheet.getCell('A9').font = { size: 11, bold: true };
    worksheet.getCell('B9').value = 0;
    worksheet.getCell('B9').font = { size: 11 };
    worksheet.getCell('B9').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };

    worksheet.getCell('A10').value = 'One-time Windfall:';
    worksheet.getCell('A10').font = { size: 11, bold: true };
    worksheet.getCell('B10').value = 0;
    worksheet.getCell('B10').font = { size: 11 };
    worksheet.getCell('B10').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };

    worksheet.getCell('A11').value = 'Market Return Adjustment (%):';
    worksheet.getCell('A11').font = { size: 11, bold: true };
    worksheet.getCell('B11').value = 0;
    worksheet.getCell('B11').font = { size: 11 };
    worksheet.getCell('B11').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };

    worksheet.getCell('A12').value = 'Emergency Exit (months early):';
    worksheet.getCell('A12').font = { size: 11, bold: true };
    worksheet.getCell('B12').value = 0;
    worksheet.getCell('B12').font = { size: 11 };
    worksheet.getCell('B12').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };

    // Set row heights for input section
    for (let i = 7; i <= 12; i++) {
      worksheet.getRow(i).height = 20;
    }

    // Calculated scenario budget
    worksheet.getCell('A14').value = 'Adjusted Monthly Budget:';
    worksheet.getCell('A14').font = { size: 11, bold: true };
    worksheet.getCell('B14').value = { formula: 'B8*(1+B9/100)' };
    worksheet.getCell('B14').font = { bold: true, size: 11 };
    worksheet.getCell('B14').numFmt = '$#,##0.00';
    worksheet.getRow(14).height = 22;

    // Examples section
    worksheet.getCell('A16').value = '📚 Common Scenario Examples:';
    worksheet.getCell('A16').font = { size: 14, bold: true, color: { argb: 'FF0066CC' } };
    worksheet.getRow(16).height = 22;

    const examples = [
      ['💰 Salary Increase:', 'New Budget: +20%, Salary Increase: 20%', '→ See goals complete faster'],
      ['🎁 Year-end Bonus:', 'Windfall: AED 50,000', '→ Major boost to emergency fund'],
      ['📉 Economic Downturn:', 'New Budget: -30%, Market Adj: -20%', '→ Assess timeline delays'],
      ['✈️ Early Repatriation:', 'Emergency Exit: 12 months early', '→ Calculate lost savings'],
      ['🏠 Property Purchase:', 'Windfall: AED 200,000 (down payment)', '→ Impact on other goals'],
      ['💼 Job Change:', 'New Budget: -15%, then +25% after 6 months', '→ Two-phase modeling'],
      ['📈 Bull Market:', 'Market Adjustment: +30%', '→ Accelerated growth scenarios'],
      ['🚨 Emergency Fund:', 'Windfall: AED 75,000 (emergency only)', '→ Full emergency coverage']
    ];

    examples.forEach((example, index) => {
      const rowIndex = 18 + index;
      worksheet.getCell(rowIndex, 1).value = example[0];
      worksheet.getCell(rowIndex, 1).font = { bold: true, size: 11 }; // Increased from 10
      worksheet.getCell(rowIndex, 2).value = example[1];
      worksheet.getCell(rowIndex, 2).font = { size: 11 }; // Increased from 10
      worksheet.getCell(rowIndex, 3).value = example[2];
      worksheet.getCell(rowIndex, 3).font = { italic: true, size: 11, color: { argb: 'FF666666' } }; // Increased from 10
      worksheet.getRow(rowIndex).height = 20;
    });

    // How to use section
    worksheet.getCell('A27').value = '🎯 How to Use This Sheet:';
    worksheet.getCell('A27').font = { size: 14, bold: true, color: { argb: 'FF059669' } }; // Increased from 12
    worksheet.getRow(27).height = 22;

    const instructions = [
      '1. 📝 Change any YELLOW cell values to model your scenario',
      '2. 👀 Watch the "Scenario Impact Analysis" update automatically',
      '3. 🔍 Check each goal\'s new timeline and contribution requirements',
      '4. 📊 Review the "Overall Plan Impact" for summary insights',
      '5. 💡 Use "Scenario Analysis" recommendations for decision making',
      '6. 🔄 Try multiple scenarios to find your optimal financial strategy'
    ];

    instructions.forEach((instruction, index) => {
      worksheet.getCell(29 + index, 1).value = instruction;
      worksheet.getCell(29 + index, 1).font = { size: 11 }; // Increased from 10
      worksheet.mergeCells(`A${29 + index}:C${29 + index}`);
      worksheet.getRow(29 + index).height = 18;
    });

    // Practical walkthrough section
    worksheet.getCell('A36').value = '🚀 Step-by-Step Example: "Got a Promotion!"';
    worksheet.getCell('A36').font = { size: 14, bold: true, color: { argb: 'FF059669' } }; // Increased from 12
    worksheet.getRow(36).height = 22;

    const walkthrough = [
      'Scenario: You got promoted with 25% salary increase + AED 30,000 bonus',
      '',
      'Step 1: Change "New Monthly Budget" to 125% of current (if current is 10,000 → enter 12,500)',
      'Step 2: Enter "25" in Salary Increase (%)',
      'Step 3: Enter "30000" in One-time Windfall',
      'Step 4: Leave other fields at 0',
      '',
      'Results to Check:',
      '• How much faster will each goal complete?',
      '• Which goal benefits most from the windfall?',
      '• Can you add a new goal (vacation, car upgrade)?',
      '• Should you increase emergency fund target?'
    ];

    walkthrough.forEach((step, index) => {
      const rowIndex = 38 + index;
      worksheet.getCell(rowIndex, 1).value = step;
      if (step === '' || step.includes('Scenario:') || step.includes('Results to Check:')) {
        worksheet.getCell(rowIndex, 1).font = { bold: true, size: 11 }; // Increased from 10
      } else {
        worksheet.getCell(rowIndex, 1).font = { size: 11 }; // Increased from 10
      }
      worksheet.mergeCells(`A${rowIndex}:D${rowIndex}`);
      worksheet.getRow(rowIndex).height = 18;
    });

    // Quick scenarios section
    worksheet.getCell('E36').value = '⚡ Quick Test Scenarios:';
    worksheet.getCell('E36').font = { size: 14, bold: true, color: { argb: 'FFFF6600' } }; // Increased from 12

    const quickScenarios = [
      ['Emergency Exit Test:', 'Set Emergency Exit to 18 months'],
      ['Market Crash:', 'Set Market Adj to -40%'],
      ['Windfall Impact:', 'Set Windfall to 100,000'],
      ['Budget Cuts:', 'Reduce New Budget by 25%'],
      ['Double Income:', 'Double the New Monthly Budget'],
      ['Conservative Plan:', 'Set Market Adj to -10%']
    ];

    quickScenarios.forEach((scenario, index) => {
      const rowIndex = 38 + index;
      worksheet.getCell(rowIndex, 5).value = scenario[0];
      worksheet.getCell(rowIndex, 5).font = { bold: true, size: 11 }; // Increased from 10
      worksheet.getCell(rowIndex, 6).value = scenario[1];
      worksheet.getCell(rowIndex, 6).font = { size: 11 }; // Increased from 10
      worksheet.getRow(rowIndex).height = 18;
    });

    // Scenario results section
    worksheet.getCell('E5').value = '📊 Scenario Impact Analysis';
    worksheet.getCell('E5').font = { size: 16, bold: true }; // Increased from 14
    worksheet.getRow(5).height = 22;

    const resultHeaders = ['Metric', 'Current Plan', 'Scenario Result', 'Difference', 'Impact'];
    resultHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(7, 5 + index);
      cell.value = header;
      cell.font = { bold: true, size: 12 }; // Added size
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F3FF' } };
    });
    worksheet.getRow(7).height = 22;

    // Goal-by-goal analysis
    let currentRow = 8;
    data.goals.forEach((goal, index) => {
      const allocation = data.allocations.find(a => a.goal?.id === goal.id);
      const currentMonthly = allocation?.requiredPMT || 0; // Fixed: use requiredPMT instead of monthlyContribution
      const originalCompletion = goal.horizonMonths || 60;
      
      // Goal header
      worksheet.getCell(currentRow, 5).value = `${goal.name}:`;
      worksheet.getCell(currentRow, 5).font = { bold: true, color: { argb: 'FF059669' }, size: 12 }; // Added size
      worksheet.getRow(currentRow).height = 20;
      currentRow++;

      // Monthly contribution impact
      worksheet.getCell(currentRow, 5).value = 'Monthly Contribution';
      worksheet.getCell(currentRow, 5).font = { size: 11 };
      worksheet.getCell(currentRow, 6).value = currentMonthly;
      worksheet.getCell(currentRow, 6).numFmt = '$#,##0.00';
      worksheet.getCell(currentRow, 6).font = { size: 11 };
      
      // Scenario monthly (proportional to budget change)
      worksheet.getCell(currentRow, 7).value = { formula: `F${currentRow}*(B14/B7)` };
      worksheet.getCell(currentRow, 7).numFmt = '$#,##0.00';
      worksheet.getCell(currentRow, 7).font = { size: 11 };
      
      // Difference
      worksheet.getCell(currentRow, 8).value = { formula: `G${currentRow}-F${currentRow}` };
      worksheet.getCell(currentRow, 8).numFmt = '$#,##0.00';
      worksheet.getCell(currentRow, 8).font = { size: 11 };
      
      // Impact percentage
      worksheet.getCell(currentRow, 9).value = { formula: `IF(F${currentRow}>0,H${currentRow}/F${currentRow}*100,0)` };
      worksheet.getCell(currentRow, 9).numFmt = '0.0"%"';
      worksheet.getCell(currentRow, 9).font = { size: 11 };
      worksheet.getRow(currentRow).height = 18;
      currentRow++;

      // Time to completion
      worksheet.getCell(currentRow, 5).value = 'Time to Complete';
      worksheet.getCell(currentRow, 5).font = { size: 11 };
      worksheet.getCell(currentRow, 6).value = originalCompletion;
      worksheet.getCell(currentRow, 6).font = { size: 11 };
      
      // Scenario completion time (considering windfall and budget changes)
      const targetAmount = goal.amount;
      worksheet.getCell(currentRow, 7).value = { 
        formula: `IF(G${currentRow-1}>0,MAX(1,(${targetAmount}-B10-B11)/G${currentRow-1}),999)` 
      };
      worksheet.getCell(currentRow, 7).font = { size: 11 };
      
      // Time difference
      worksheet.getCell(currentRow, 8).value = { formula: `F${currentRow}-G${currentRow}` };
      worksheet.getCell(currentRow, 8).font = { size: 11 };
      
      // Time impact
      worksheet.getCell(currentRow, 9).value = { formula: `IF(F${currentRow}>0,H${currentRow}/F${currentRow}*100,0)` };
      worksheet.getCell(currentRow, 9).numFmt = '0.0"%"';
      worksheet.getCell(currentRow, 9).font = { size: 11 };
      worksheet.getRow(currentRow).height = 18;
      currentRow += 2;
    });

    // Overall summary section with increased font sizes
    worksheet.getCell(currentRow, 5).value = '📈 Overall Plan Impact';
    worksheet.getCell(currentRow, 5).font = { size: 14, bold: true }; // Increased from 12
    worksheet.getRow(currentRow).height = 22;
    currentRow++;

    // Total monthly savings change
    worksheet.getCell(currentRow, 5).value = 'Total Monthly Savings';
    worksheet.getCell(currentRow, 5).font = { size: 11 };
    worksheet.getCell(currentRow, 6).value = data.monthlyBudget;
    worksheet.getCell(currentRow, 6).numFmt = '$#,##0.00';
    worksheet.getCell(currentRow, 6).font = { size: 11 };
    worksheet.getCell(currentRow, 7).value = { formula: 'B14' };
    worksheet.getCell(currentRow, 7).numFmt = '$#,##0.00';
    worksheet.getCell(currentRow, 7).font = { size: 11 };
    worksheet.getCell(currentRow, 8).value = { formula: `G${currentRow}-F${currentRow}` };
    worksheet.getCell(currentRow, 8).numFmt = '$#,##0.00';
    worksheet.getCell(currentRow, 8).font = { size: 11 };
    worksheet.getCell(currentRow, 9).value = { formula: `IF(F${currentRow}>0,H${currentRow}/F${currentRow}*100,0)` };
    worksheet.getCell(currentRow, 9).numFmt = '0.0"%"';
    worksheet.getCell(currentRow, 9).font = { size: 11 };
    worksheet.getRow(currentRow).height = 18;
    currentRow++;

    // Plan completion time
    worksheet.getCell(currentRow, 5).value = 'Plan Completion';
    worksheet.getCell(currentRow, 5).font = { size: 11 };
    worksheet.getCell(currentRow, 6).value = data.totalMonths;
    worksheet.getCell(currentRow, 7).value = { formula: `MAX(1,${data.totalMonths}*(B7/B14)-(B12))` };
    worksheet.getCell(currentRow, 8).value = { formula: `F${currentRow}-G${currentRow}` };
    worksheet.getCell(currentRow, 9).value = { formula: `IF(F${currentRow}>0,H${currentRow}/F${currentRow}*100,0)` };
    worksheet.getCell(currentRow, 9).numFmt = '0.0"%"';
    currentRow++;

    // Emergency exit impact
    worksheet.getCell(currentRow, 5).value = 'Early Exit Impact';
    worksheet.getCell(currentRow, 6).value = '0 months';
    worksheet.getCell(currentRow, 7).value = { formula: 'B12&" months early"' };
    worksheet.getCell(currentRow, 8).value = { formula: `B12*B14` };
    worksheet.getCell(currentRow, 8).numFmt = '$#,##0.00';
    worksheet.getCell(currentRow, 9).value = { formula: `IF(B12>0,"Lost Savings","No Impact")` };
    currentRow += 2;

    // Scenario recommendations
    worksheet.getCell(currentRow, 5).value = '💡 Scenario Analysis';
    worksheet.getCell(currentRow, 5).font = { size: 12, bold: true };
    currentRow++;

    worksheet.getCell(currentRow, 5).value = 'Budget Adequacy:';
    worksheet.getCell(currentRow, 6).value = { 
      formula: `IF(B14>B7,"✅ Improved","⚠️ Reduced")` 
    };
    currentRow++;

    worksheet.getCell(currentRow, 5).value = 'Goal Achievement:';
    worksheet.getCell(currentRow, 6).value = { 
      formula: `IF(B14>B7*1.1,"🚀 Accelerated",IF(B14>B7*0.9,"✅ On Track","🚨 At Risk"))` 
    };
    currentRow++;

    worksheet.getCell(currentRow, 5).value = 'Emergency Preparedness:';
    worksheet.getCell(currentRow, 6).value = { 
      formula: `IF(B10>B7*6,"✅ Well Prepared",IF(B10>B7*3,"⚠️ Moderate","🚨 Low Buffer"))` 
    };

    // Set column widths
    worksheet.getColumn('A').width = 30;
    worksheet.getColumn('B').width = 18;
    worksheet.getColumn('C').width = 35; // Wider for examples
    worksheet.getColumn('D').width = 15;
    worksheet.getColumn('E').width = 22;
    worksheet.getColumn('F').width = 18;
    worksheet.getColumn('G').width = 15;
    worksheet.getColumn('H').width = 15;
    worksheet.getColumn('I').width = 12;
  }

  private async createProgressAnalyticsSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('📊 Progress Analytics');

    worksheet.mergeCells('A1:H1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '📊 Progress Analytics & Performance Tracking';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF059669' } }; // Increased from 16
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Monthly progress tracking table
    worksheet.getCell('A3').value = '📈 Monthly Progress Summary';
    worksheet.getCell('A3').font = { size: 16, bold: true }; // Increased from 14
    worksheet.getRow(3).height = 25;

    const progressHeaders = ['Month', 'Total Saved', 'Target for Month', 'Variance', 'Cumulative Target', 'Cumulative Actual', 'On Track?'];
    progressHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(5, index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 12 }; // Added size
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F3FF' } };
    });
    worksheet.getRow(5).height = 25;

    // Add 12 months of progress tracking
    for (let month = 1; month <= 12; month++) {
      const rowIndex = 5 + month;
      worksheet.getCell(rowIndex, 1).value = `Month ${month}`;
      worksheet.getCell(rowIndex, 1).font = { size: 11 };
      worksheet.getCell(rowIndex, 2).value = 0; // User input
      worksheet.getCell(rowIndex, 2).font = { size: 11 };
      worksheet.getCell(rowIndex, 3).value = data.monthlyBudget;
      worksheet.getCell(rowIndex, 3).font = { size: 11 };
      worksheet.getCell(rowIndex, 4).value = { formula: `B${rowIndex}-C${rowIndex}` };
      worksheet.getCell(rowIndex, 4).font = { size: 11 };
      worksheet.getCell(rowIndex, 5).value = data.monthlyBudget * month;
      worksheet.getCell(rowIndex, 5).font = { size: 11 };
      worksheet.getCell(rowIndex, 6).value = { formula: `SUM(B6:B${rowIndex})` };
      worksheet.getCell(rowIndex, 6).font = { size: 11 };
      worksheet.getCell(rowIndex, 7).value = { formula: `IF(F${rowIndex}>=E${rowIndex},"✓ On Track","⚠ Behind")` };
      worksheet.getCell(rowIndex, 7).font = { size: 11 };
      worksheet.getRow(rowIndex).height = 20;
    }

    // Setup checklist section
    worksheet.getCell('A18').value = '🛠️ Initial Setup Checklist';
    worksheet.getCell('A18').font = { size: 16, bold: true }; // Increased from 14
    worksheet.getRow(18).height = 25;

    const setupItems = [
      'Choose primary bank for emergency fund',
      'Open high-yield savings account',
      'Set up automatic transfers from salary account',
      'Research and select investment platform',
      'Complete investment account KYC',
      'Define investment strategy for each goal',
      'Set up portfolio tracking system',
      'Create monthly review calendar reminders',
      'Document all account details securely',
      'Share plan with spouse/financial advisor'
    ];

    setupItems.forEach((item, index) => {
      const rowIndex = 20 + index;
      worksheet.getCell(rowIndex, 1).value = item;
      worksheet.getCell(rowIndex, 1).font = { size: 11 };
      worksheet.getCell(rowIndex, 2).value = false; // Checkbox
      worksheet.getRow(rowIndex).height = 20;
    });

    // Set column widths - increased for better readability
    worksheet.columns.forEach(column => {
      column.width = 28; // Increased from 25
    });
  }

  private async createCalculatorToolsSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('🧮 Calculators');

    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '🧮 Financial Calculators & Tools';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF059669' } }; // Increased from 16
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Emergency Fund Calculator
    worksheet.getCell('A3').value = '🚨 Emergency Fund Calculator';
    worksheet.getCell('A3').font = { size: 16, bold: true }; // Increased from 14
    worksheet.getRow(3).height = 25;

    worksheet.getCell('A5').value = 'Monthly Expenses:';
    worksheet.getCell('A5').font = { size: 12, bold: true };
    worksheet.getCell('B5').value = 0; // User input
    worksheet.getCell('B5').font = { size: 12 };
    worksheet.getCell('A6').value = 'Months of Coverage:';
    worksheet.getCell('A6').font = { size: 12, bold: true };
    worksheet.getCell('B6').value = 6; // Default
    worksheet.getCell('B6').font = { size: 12 };
    worksheet.getCell('A7').value = 'Recommended Emergency Fund:';
    worksheet.getCell('A7').font = { size: 12, bold: true };
    worksheet.getCell('B7').value = { formula: 'B5*B6' };
    worksheet.getCell('B7').font = { bold: true, size: 12 };
    
    // Set row heights
    for (let i = 5; i <= 7; i++) {
      worksheet.getRow(i).height = 22;
    }

    // Compound Interest Calculator
    worksheet.getCell('A10').value = '📈 Compound Interest Calculator';
    worksheet.getCell('A10').font = { size: 16, bold: true }; // Increased from 14
    worksheet.getRow(10).height = 25;

    worksheet.getCell('A12').value = 'Initial Amount:';
    worksheet.getCell('A12').font = { size: 12, bold: true };
    worksheet.getCell('B12').value = 0;
    worksheet.getCell('B12').font = { size: 12 };
    worksheet.getCell('A13').value = 'Monthly Contribution:';
    worksheet.getCell('A13').font = { size: 12, bold: true };
    worksheet.getCell('B13').value = 0;
    worksheet.getCell('B13').font = { size: 12 };
    worksheet.getCell('A14').value = 'Annual Interest Rate (%):';
    worksheet.getCell('A14').font = { size: 12, bold: true };
    worksheet.getCell('B14').value = 7;
    worksheet.getCell('B14').font = { size: 12 };
    worksheet.getCell('A15').value = 'Years:';
    worksheet.getCell('A15').font = { size: 12, bold: true };
    worksheet.getCell('B15').value = 10;
    worksheet.getCell('B15').font = { size: 12 };
    worksheet.getCell('A16').value = 'Future Value:';
    worksheet.getCell('A16').font = { size: 12, bold: true };
    worksheet.getCell('B16').value = { formula: 'FV(B14/100/12,B15*12,-B13,-B12)' };
    worksheet.getCell('B16').font = { bold: true, size: 12 };
    
    // Set row heights
    for (let i = 12; i <= 16; i++) {
      worksheet.getRow(i).height = 22;
    }

    // Property Down Payment Calculator
    worksheet.getCell('A19').value = '🏠 UAE Property Down Payment Calculator';
    worksheet.getCell('A19').font = { size: 16, bold: true }; // Increased from 14
    worksheet.getRow(19).height = 25;

    worksheet.getCell('A21').value = 'Property Value:';
    worksheet.getCell('A21').font = { size: 12, bold: true };
    worksheet.getCell('B21').value = 0;
    worksheet.getCell('B21').font = { size: 12 };
    worksheet.getCell('A22').value = 'Expat/UAE National:';
    worksheet.getCell('A22').font = { size: 12, bold: true };
    worksheet.getCell('B22').value = 'Expat'; // Dropdown needed
    worksheet.getCell('B22').font = { size: 12 };
    worksheet.getCell('A23').value = 'Down Payment %:';
    worksheet.getCell('A23').font = { size: 12, bold: true };
    worksheet.getCell('B23').value = { formula: 'IF(B22="Expat",25,20)' };
    worksheet.getCell('B23').font = { size: 12 };
    worksheet.getCell('A24').value = 'Required Down Payment:';
    worksheet.getCell('A24').font = { size: 12, bold: true };
    worksheet.getCell('B24').value = { formula: 'B21*B23/100' };
    worksheet.getCell('B24').font = { bold: true, size: 12 };
    
    // Set row heights
    for (let i = 21; i <= 24; i++) {
      worksheet.getRow(i).height = 22;
    }

    // Currency Converter
    worksheet.getCell('A27').value = '💱 Currency Converter';
    worksheet.getCell('A27').font = { size: 16, bold: true }; // Increased from 14
    worksheet.getRow(27).height = 25;

    worksheet.getCell('A29').value = 'Amount:';
    worksheet.getCell('A29').font = { size: 12, bold: true };
    worksheet.getCell('B29').value = 0;
    worksheet.getCell('B29').font = { size: 12 };
    worksheet.getCell('A30').value = 'From Currency:';
    worksheet.getCell('A30').font = { size: 12, bold: true };
    worksheet.getCell('B30').value = data.currency.code;
    worksheet.getCell('B30').font = { size: 12 };
    worksheet.getCell('A31').value = 'To Currency:';
    worksheet.getCell('A31').font = { size: 12, bold: true };
    worksheet.getCell('B31').value = 'USD';
    worksheet.getCell('B31').font = { size: 12 };
    worksheet.getCell('A32').value = 'Exchange Rate:';
    worksheet.getCell('A32').font = { size: 12, bold: true };
    worksheet.getCell('B32').value = 1; // User needs to update
    worksheet.getCell('B32').font = { size: 12 };
    worksheet.getCell('A33').value = 'Converted Amount:';
    worksheet.getCell('A33').font = { size: 12, bold: true };
    worksheet.getCell('B33').value = { formula: 'B29*B32' };
    worksheet.getCell('B33').font = { bold: true, size: 12 };
    
    // Set row heights
    for (let i = 29; i <= 33; i++) {
      worksheet.getRow(i).height = 22;
    }

    // Set column widths - increased for better readability
    worksheet.columns.forEach(column => {
      column.width = 25; // Increased from 20
    });
  }

  private async createReferenceDataSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('📋 Reference Data');

    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '📋 GCC Expat Financial Reference Guide';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF059669' } };
    titleCell.alignment = { horizontal: 'center' };

    // UAE Financial Guidelines
    worksheet.getCell('A3').value = '🇦🇪 UAE Financial Guidelines';
    worksheet.getCell('A3').font = { size: 14, bold: true };

    const uaeGuidelines = [
      ['Tax Rate:', '0% (No income tax)'],
      ['VAT Rate:', '5%'],
      ['Property Down Payment (Expat):', '25%'],
      ['Property Down Payment (National):', '20%'],
      ['Maximum Mortgage (Expat):', '75% of property value'],
      ['Debt-to-Income Ratio:', 'Max 50%'],
      ['Savings Account Interest:', '0.25% - 2.25%'],
      ['Investment Minimum:', 'Varies by platform']
    ];

    uaeGuidelines.forEach((guideline, index) => {
      worksheet.getCell(5 + index, 1).value = guideline[0];
      worksheet.getCell(5 + index, 2).value = guideline[1];
    });

    // Visa and Residency Impact
    worksheet.getCell('A15').value = '📄 Visa & Residency Considerations';
    worksheet.getCell('A15').font = { size: 14, bold: true };

    const visaConsiderations = [
      'Employment visa cancellation requires leaving UAE within 30 days',
      'Bank accounts can remain open with minimum balance',
      'Investment accounts may have different rules',
      'Golden visa holders have 10-year residency',
      'Property ownership grants renewable residency visa',
      'End of service benefits are tax-free',
      'Pension fund transfers may be subject to home country tax'
    ];

    visaConsiderations.forEach((consideration, index) => {
      worksheet.getCell(17 + index, 1).value = `• ${consideration}`;
    });

    // Repatriation Planning
    worksheet.getCell('A26').value = '✈️ Repatriation Financial Planning';
    worksheet.getCell('A26').font = { size: 14, bold: true };

    const repatriationSteps = [
      '1. Close or maintain UAE bank accounts (check minimum balances)',
      '2. Transfer investment portfolios to home country broker',
      '3. Liquidate UAE-specific investments (if needed)',
      '4. Plan tax implications in home country',
      '5. Convert currency at optimal exchange rates',
      '6. Update all account addresses and tax residency',
      '7. Consider keeping UAE account for property investments'
    ];

    repatriationSteps.forEach((step, index) => {
      worksheet.getCell(28 + index, 1).value = step;
    });

    // Investment Limits by Country
    worksheet.getCell('D3').value = '🌍 Investment Limits by GCC Country';
    worksheet.getCell('D3').font = { size: 14, bold: true };

    const investmentLimits = [
      ['Country', 'Foreign Investment Limit', 'Property Ownership'],
      ['UAE', 'No limit', 'Freehold in designated areas'],
      ['Saudi Arabia', 'Limited sectors', 'Not allowed'],
      ['Qatar', 'Limited sectors', 'Limited areas'],
      ['Kuwait', 'Limited to 49%', 'Not allowed'],
      ['Bahrain', 'Up to 100% in most sectors', 'Freehold available'],
      ['Oman', 'Up to 70% in most sectors', 'Limited areas']
    ];

    investmentLimits.forEach((limit, index) => {
      limit.forEach((value, colIndex) => {
        const cell = worksheet.getCell(5 + index, 4 + colIndex);
        cell.value = value;
        if (index === 0) {
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F3FF' } };
        }
      });
    });

    worksheet.columns.forEach(column => {
      column.width = 25;
    });
  }

  // Helper methods
  private getColumnLetter(columnIndex: number): string {
    let result = '';
    while (columnIndex > 0) {
      columnIndex--;
      result = String.fromCharCode(65 + (columnIndex % 26)) + result;
      columnIndex = Math.floor(columnIndex / 26);
    }
    return result;
  }

  private getGoalRateAndPhase(goal: any, monthIndex: number): { targetRate: number; phase: string } {
    const years = (goal.horizonMonths || 60) / 12;
    const monthsRemaining = (goal.horizonMonths || 60) - monthIndex;
    const yearsRemaining = monthsRemaining / 12;
    
    // Get risk tolerance adjustment factor
    const riskTolerance = goal.riskTolerance || 'Medium';
    const riskAdjustment = this.getRiskAdjustment(riskTolerance);
    
    // Emergency fund special case - always low risk regardless of preference
    if (goal.id === 'emergency-fund' || goal.name.toLowerCase().includes('emergency')) {
      return {
        targetRate: 0.025, // 2.5% - fixed for liquidity
        phase: 'Liquidity'
      };
    }
    
    // Goals with payment periods (education, home)
    const hasPaymentPeriod = goal.paymentPeriod && goal.paymentFrequency && goal.paymentFrequency !== 'Once';
    if (hasPaymentPeriod) {
      if (monthsRemaining <= 12) {
        return { targetRate: Math.max(0.025, 0.025 + riskAdjustment * 0.5), phase: 'Drawdown' };
      } else if (yearsRemaining <= 2) {
        return { targetRate: Math.max(0.025, 0.035 + riskAdjustment), phase: 'Pre-Target' };
      } else if (years <= 5) {
        return { targetRate: Math.max(0.03, 0.065 + riskAdjustment), phase: 'Conservative' };
      } else {
        if (yearsRemaining > years * 0.6) {
          return { targetRate: Math.max(0.04, 0.08 + riskAdjustment), phase: 'Growth' };
        } else {
          return { targetRate: Math.max(0.035, 0.065 + riskAdjustment), phase: 'Balanced' };
        }
      }
    }
    
    // Regular investment goals
    if (years <= 3) {
      return { targetRate: Math.max(0.025, 0.045 + riskAdjustment), phase: 'Conservative' };
    } else if (years <= 7) {
      if (yearsRemaining > years * 0.5) {
        return { targetRate: Math.max(0.04, 0.07 + riskAdjustment), phase: 'Growth' };
      } else {
        return { targetRate: Math.max(0.03, 0.055 + riskAdjustment), phase: 'Balanced' };
      }
    } else {
      // Long-term goals (>7 years)
      if (yearsRemaining > years * 0.7) {
        return { targetRate: Math.max(0.045, 0.082 + riskAdjustment), phase: 'Growth' };
      } else if (yearsRemaining > years * 0.3) {
        return { targetRate: Math.max(0.04, 0.065 + riskAdjustment), phase: 'Balanced' };
      } else {
        return { targetRate: Math.max(0.025, 0.045 + riskAdjustment), phase: 'Preservation' };
      }
    }
  }

  // Helper function to get risk adjustment factor
  private getRiskAdjustment(riskTolerance: string): number {
    switch (riskTolerance) {
      case 'Very Low': return -0.015;  // Reduce rates by 1.5%
      case 'Low': return -0.01;        // Reduce rates by 1%
      case 'Medium': return 0;         // No adjustment (baseline)
      case 'Medium-High': return 0.01; // Increase rates by 1%
      case 'High': return 0.02;        // Increase rates by 2%
      default: return 0;
    }
  }

  private generateGoalPhases(goal: any): Array<{
    name: string;
    startMonth: number;
    endMonth: number;
    rate: number;
    investmentType: string;
    riskLevel: string;
    trigger: string;
    action: string;
  }> {
    const totalMonths = goal.horizonMonths || 60;
    const years = totalMonths / 12;
    const phases: any[] = [];
    
    // Get risk tolerance and adjustment
    const riskTolerance = goal.riskTolerance || 'Medium';
    const riskAdjustment = this.getRiskAdjustment(riskTolerance);
    const riskNote = riskTolerance !== 'Medium' ? ` (${riskTolerance} risk preference)` : '';
    
    if (goal.id === 'emergency-fund' || goal.name.toLowerCase().includes('emergency')) {
      phases.push({
        name: 'Liquidity Phase',
        startMonth: 1,
        endMonth: totalMonths,
        rate: 0.025, // Fixed for emergency fund
        investmentType: 'High-Yield Savings',
        riskLevel: 'Very Low',
        trigger: 'Immediate access needed',
        action: 'Maintain in liquid savings account'
      });
    } else if (years <= 3) {
      const adjustedRate = Math.max(0.025, 0.045 + riskAdjustment);
      phases.push({
        name: `Conservative Phase${riskNote}`,
        startMonth: 1,
        endMonth: totalMonths,
        rate: adjustedRate,
        investmentType: this.getInvestmentTypeForRate(adjustedRate),
        riskLevel: this.getRiskLevelForTolerance(riskTolerance, 'Conservative'),
        trigger: 'Short timeline',
        action: `Focus on capital preservation${riskNote}`
      });
    } else if (years <= 7) {
      const switchMonth = Math.round(totalMonths * 0.5);
      const growthRate = Math.max(0.04, 0.07 + riskAdjustment);
      const balancedRate = Math.max(0.03, 0.055 + riskAdjustment);
      
      phases.push({
        name: `Growth Phase${riskNote}`,
        startMonth: 1,
        endMonth: switchMonth,
        rate: growthRate,
        investmentType: this.getInvestmentTypeForRate(growthRate),
        riskLevel: this.getRiskLevelForTolerance(riskTolerance, 'Growth'),
        trigger: 'Time horizon > 3.5 years',
        action: `Invest in diversified growth portfolio${riskNote}`
      });
      phases.push({
        name: `Preservation Phase${riskNote}`,
        startMonth: switchMonth + 1,
        endMonth: totalMonths,
        rate: balancedRate,
        investmentType: this.getInvestmentTypeForRate(balancedRate),
        riskLevel: this.getRiskLevelForTolerance(riskTolerance, 'Balanced'),
        trigger: 'Approaching target date',
        action: `Shift to capital preservation${riskNote}`
      });
    } else {
      const growthEnd = Math.round(totalMonths * 0.7);
      const balancedEnd = Math.round(totalMonths * 0.9);
      const aggressiveRate = Math.max(0.045, 0.082 + riskAdjustment);
      const balancedRate = Math.max(0.04, 0.065 + riskAdjustment);
      const preservationRate = Math.max(0.025, 0.045 + riskAdjustment);
      
      phases.push({
        name: `Aggressive Growth${riskNote}`,
        startMonth: 1,
        endMonth: growthEnd,
        rate: aggressiveRate,
        investmentType: this.getInvestmentTypeForRate(aggressiveRate),
        riskLevel: this.getRiskLevelForTolerance(riskTolerance, 'Aggressive'),
        trigger: 'Long time horizon',
        action: `Maximize growth potential${riskNote}`
      });
      phases.push({
        name: `Balanced Growth${riskNote}`,
        startMonth: growthEnd + 1,
        endMonth: balancedEnd,
        rate: balancedRate,
        investmentType: this.getInvestmentTypeForRate(balancedRate),
        riskLevel: this.getRiskLevelForTolerance(riskTolerance, 'Balanced'),
        trigger: 'Mid-term approach',
        action: `Begin risk reduction${riskNote}`
      });
      phases.push({
        name: `Capital Preservation${riskNote}`,
        startMonth: balancedEnd + 1,
        endMonth: totalMonths,
        rate: preservationRate,
        investmentType: this.getInvestmentTypeForRate(preservationRate),
        riskLevel: this.getRiskLevelForTolerance(riskTolerance, 'Preservation'),
        trigger: 'Near target date',
        action: `Preserve capital, reduce volatility${riskNote}`
      });
    }
    
    return phases;
  }

  // Helper function to get investment type based on rate
  private getInvestmentTypeForRate(rate: number): string {
    if (rate <= 0.03) return 'High-Yield Savings/CDs';
    if (rate <= 0.05) return 'Conservative Bonds/Fixed Income';
    if (rate <= 0.07) return 'Balanced Funds/Mixed ETFs';
    if (rate <= 0.09) return 'Growth Funds/Equity ETFs';
    return 'Aggressive Growth/Small Cap';
  }

  // Helper function to adjust risk level based on tolerance
  private getRiskLevelForTolerance(tolerance: string, baseLevel: string): string {
    const adjustments: Record<string, Record<string, string>> = {
      'Very Low': {
        'Aggressive': 'Medium',
        'Growth': 'Low',
        'Balanced': 'Very Low',
        'Conservative': 'Very Low',
        'Preservation': 'Very Low'
      },
      'Low': {
        'Aggressive': 'Medium-High',
        'Growth': 'Medium',
        'Balanced': 'Low',
        'Conservative': 'Very Low',
        'Preservation': 'Very Low'
      },
      'Medium-High': {
        'Aggressive': 'High',
        'Growth': 'Medium-High',
        'Balanced': 'Medium-High',
        'Conservative': 'Medium',
        'Preservation': 'Low'
      },
      'High': {
        'Aggressive': 'High',
        'Growth': 'High',
        'Balanced': 'Medium-High',
        'Conservative': 'Medium',
        'Preservation': 'Medium'
      }
    };

    return adjustments[tolerance]?.[baseLevel] || baseLevel;
  }

  private getGoalRateChanges(goal: any): Array<{
    month: number;
    description: string;
    action: string;
    isImportant: boolean;
  }> {
    const phases = this.generateGoalPhases(goal);
    const changes: any[] = [];
    
    phases.forEach((phase, index) => {
      if (index > 0) { // Skip first phase start
        changes.push({
          month: phase.startMonth,
          description: `Transition to ${phase.name} (${(phase.rate * 100).toFixed(1)}%)`,
          action: phase.action,
          isImportant: true
        });
      }
      
      // Add quarterly review reminders for long phases
      if (phase.endMonth - phase.startMonth > 12) {
        const reviewMonth = phase.startMonth + 6;
        if (reviewMonth < phase.endMonth) {
          changes.push({
            month: reviewMonth,
            description: `Mid-phase review for ${phase.name}`,
            action: 'Review performance and rebalance if needed',
            isImportant: false
          });
        }
      }
    });
    
    return changes.sort((a, b) => a.month - b.month);
  }

  private addMonthlyTrackerConditionalFormatting(worksheet: ExcelJS.Worksheet, data: ExcelData) {
    // Add conditional formatting for variance columns
    const startRow = 9;
    const endRow = startRow + data.totalMonths - 1;
    
    // Find variance column (total actual vs budget)
    const varianceCol = 4 + (data.goals.length * 5) + 1;
    const varianceRange = `${this.getColumnLetter(varianceCol)}${startRow}:${this.getColumnLetter(varianceCol)}${endRow}`;
    
    try {
      // Green for positive variance
      worksheet.addConditionalFormatting({
        ref: varianceRange,
        rules: [{
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: ['-1'],
          priority: 1,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFE5FFE5' }
            }
          }
        }]
      });
      
      // Red for negative variance
      worksheet.addConditionalFormatting({
        ref: varianceRange,
        rules: [{
          type: 'cellIs',
          operator: 'lessThan',
          formulae: ['0'],
          priority: 2,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              bgColor: { argb: 'FFFFE5E5' }
            }
          }
        }]
      });
    } catch (error) {
      // If conditional formatting fails, continue without it
      console.warn('Could not add conditional formatting:', error);
    }
  }

  private async createActionItemsSheet(workbook: ExcelJS.Workbook, data: ExcelData) {
    const worksheet = workbook.addWorksheet('📋 Action Items');

    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = '📋 Financial Plan Action Items';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF059669' } };
    titleCell.alignment = { horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Instructions
    worksheet.getCell('A3').value = '💡 Use this sheet to track your progress on key action items for your financial plan.';
    worksheet.getCell('A3').font = { italic: true, color: { argb: 'FF666666' }, size: 11 };
    worksheet.mergeCells('A3:F3');
    worksheet.getRow(3).height = 20;

    // Action items table headers
    const headers = ['Action Item', 'Priority', 'Target Date', 'Status', 'Notes', 'Completed'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(5, index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 12 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5F3FF' } };
    });
    worksheet.getRow(5).height = 25;

    // Pre-populated action items
    const actionItems = [
      ['Open high-yield savings account', 'High', '1 week', 'Not Started', 'Compare UAE banks for best rates', false],
      ['Set up automatic transfers', 'High', '2 weeks', 'Not Started', 'Configure salary account transfers', false],
      ['Research investment platforms', 'Medium', '3 weeks', 'Not Started', 'Compare Sarwa, ADIB, etc.', false],
      ['Complete investment KYC', 'Medium', '1 month', 'Not Started', 'Prepare required documents', false],
      ['Create emergency fund', 'High', '2 months', 'Not Started', '6 months expenses target', false],
      ['Review insurance coverage', 'Medium', '1 month', 'Not Started', 'Health, life, disability', false],
      ['Set up monthly review schedule', 'Low', '1 week', 'Not Started', 'Calendar reminders', false],
      ['Document financial accounts', 'Medium', '2 weeks', 'Not Started', 'Secure password manager', false]
    ];

    actionItems.forEach((item, index) => {
      const rowIndex = 6 + index;
      worksheet.getCell(rowIndex, 1).value = item[0];
      worksheet.getCell(rowIndex, 1).font = { size: 11 };
      worksheet.getCell(rowIndex, 2).value = item[1];
      worksheet.getCell(rowIndex, 2).font = { size: 11 };
      worksheet.getCell(rowIndex, 3).value = item[2];
      worksheet.getCell(rowIndex, 3).font = { size: 11 };
      worksheet.getCell(rowIndex, 4).value = item[3];
      worksheet.getCell(rowIndex, 4).font = { size: 11 };
      worksheet.getCell(rowIndex, 5).value = item[4];
      worksheet.getCell(rowIndex, 5).font = { size: 11 };
      worksheet.getCell(rowIndex, 6).value = item[5];
      worksheet.getCell(rowIndex, 6).font = { size: 11 };
      
      // Add priority color coding
      if (item[1] === 'High') {
        worksheet.getCell(rowIndex, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF9999' } };
      } else if (item[1] === 'Medium') {
        worksheet.getCell(rowIndex, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
      } else {
        worksheet.getCell(rowIndex, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5FFE5' } };
      }
      
      worksheet.getRow(rowIndex).height = 22;
    });

    // Add goal-specific action items
    let currentRow = 6 + actionItems.length + 2;
    worksheet.getCell(currentRow, 1).value = '🎯 Goal-Specific Action Items';
    worksheet.getCell(currentRow, 1).font = { size: 16, bold: true };
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    data.goals.forEach(goal => {
      worksheet.getCell(currentRow, 1).value = `Start investing for: ${goal.name}`;
      worksheet.getCell(currentRow, 1).font = { size: 11 };
      worksheet.getCell(currentRow, 2).value = 'Medium';
      worksheet.getCell(currentRow, 2).font = { size: 11 };
      worksheet.getCell(currentRow, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF99' } };
      worksheet.getCell(currentRow, 3).value = '1 month';
      worksheet.getCell(currentRow, 3).font = { size: 11 };
      worksheet.getCell(currentRow, 4).value = 'Not Started';
      worksheet.getCell(currentRow, 4).font = { size: 11 };
      worksheet.getCell(currentRow, 5).value = `Target: ${goal.amount} ${data.currency.code}`;
      worksheet.getCell(currentRow, 5).font = { size: 11 };
      worksheet.getCell(currentRow, 6).value = false;
      worksheet.getCell(currentRow, 6).font = { size: 11 };
      worksheet.getRow(currentRow).height = 22;
      currentRow++;
    });

    // Set column widths
    worksheet.getColumn('A').width = 35;
    worksheet.getColumn('B').width = 15;
    worksheet.getColumn('C').width = 15;
    worksheet.getColumn('D').width = 15;
    worksheet.getColumn('E').width = 30;
    worksheet.getColumn('F').width = 12;
  }
}

// Export singleton instance
export const excelService = new ExcelService(); 