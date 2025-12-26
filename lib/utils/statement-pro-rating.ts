export interface MonthlyBreakdown {
  month: string; // YYYY-MM format
  daysInMonth: number;
  daysInPeriod: number;
  prorationFactor: number; // daysInPeriod / daysInMonth
}

export function calculateMonthlyBreakdown(
  periodStart: Date,
  periodEnd: Date
): MonthlyBreakdown[] {
  const breakdowns: MonthlyBreakdown[] = [];
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  
  // Get total days in period
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  let current = new Date(start);
  
  while (current <= end) {
    const year = current.getFullYear();
    const month = current.getMonth();
    
    // Get first and last day of current month
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    // Calculate days in this month that are within the period
    const periodStartInMonth = current > start ? current : start;
    const periodEndInMonth = new Date(end) < monthEnd ? new Date(end) : monthEnd;
    
    const daysInPeriod = Math.ceil(
      (periodEndInMonth.getTime() - periodStartInMonth.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    
    const daysInMonth = monthEnd.getDate();
    const prorationFactor = daysInPeriod / daysInMonth;
    
    breakdowns.push({
      month: `${year}-${String(month + 1).padStart(2, '0')}`,
      daysInMonth,
      daysInPeriod,
      prorationFactor,
    });
    
    // Move to next month
    current = new Date(year, month + 1, 1);
  }
  
  return breakdowns;
}

export function prorateToMonthly(
  totalAmount: number,
  periodStart: Date,
  periodEnd: Date
): { monthlyAmount: number; breakdown: MonthlyBreakdown[] } {
  const breakdown = calculateMonthlyBreakdown(periodStart, periodEnd);
  
  // Calculate monthly equivalent (total / number of months)
  const totalDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const averageDaysPerMonth = 30.44; // Average days per month
  const monthsInPeriod = totalDays / averageDaysPerMonth;
  
  const monthlyAmount = totalAmount / monthsInPeriod;
  
  return { monthlyAmount, breakdown };
}

