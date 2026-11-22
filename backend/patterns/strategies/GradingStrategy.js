// Pattern: Strategy - Defines interchangeable grading algorithms (AbsoluteGrading, RelativeGrading) to calculate letter grades and GPA dynamically

class GradingStrategy {
  /**
   * @param {number} totalMarks - total marks obtained (out of 100)
   * @param {object} [context] - class statistics for relative grading (mean, stdDev, allMarks)
   * @returns {{ grade: string, gpa: number }}
   */
  calculateGrade(totalMarks, context = {}) {
    throw new Error('Method calculateGrade() must be implemented');
  }
}

class AbsoluteGradingStrategy extends GradingStrategy {
  calculateGrade(totalMarks) {
    const marks = Number(totalMarks) || 0;

    if (marks >= 85) return { grade: 'A', gpa: 4.0 };
    if (marks >= 80) return { grade: 'A-', gpa: 3.7 };
    if (marks >= 75) return { grade: 'B+', gpa: 3.3 };
    if (marks >= 70) return { grade: 'B', gpa: 3.0 };
    if (marks >= 65) return { grade: 'B-', gpa: 2.7 };
    if (marks >= 60) return { grade: 'C+', gpa: 2.3 };
    if (marks >= 55) return { grade: 'C', gpa: 2.0 };
    if (marks >= 50) return { grade: 'D', gpa: 1.0 };
    return { grade: 'F', gpa: 0.0 };
  }
}

class RelativeGradingStrategy extends GradingStrategy {
  calculateGrade(totalMarks, context = {}) {
    const marks = Number(totalMarks) || 0;
    const mean = context.mean !== undefined ? Number(context.mean) : 70;
    const stdDev = context.stdDev !== undefined && Number(context.stdDev) > 0 ? Number(context.stdDev) : 10;

    // Z-score calculation: (marks - mean) / stdDev
    const zScore = (marks - mean) / stdDev;

    if (zScore >= 1.5) return { grade: 'A', gpa: 4.0 };
    if (zScore >= 1.0) return { grade: 'A-', gpa: 3.7 };
    if (zScore >= 0.5) return { grade: 'B+', gpa: 3.3 };
    if (zScore >= 0.0) return { grade: 'B', gpa: 3.0 };
    if (zScore >= -0.5) return { grade: 'B-', gpa: 2.7 };
    if (zScore >= -1.0) return { grade: 'C+', gpa: 2.3 };
    if (zScore >= -1.5) return { grade: 'C', gpa: 2.0 };
    if (zScore >= -2.0) return { grade: 'D', gpa: 1.0 };
    return { grade: 'F', gpa: 0.0 };
  }
}

class GradingContext {
  constructor(strategy = new AbsoluteGradingStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  execute(totalMarks, context = {}) {
    return this.strategy.calculateGrade(totalMarks, context);
  }
}

module.exports = {
  GradingStrategy,
  AbsoluteGradingStrategy,
  RelativeGradingStrategy,
  GradingContext
};
