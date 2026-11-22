// Pattern: Strategy - Encapsulates interchangeable fee calculation formulas (RegularFeeStrategy, ScholarshipFeeStrategy)

class FeeCalculationStrategy {
  /**
   * @param {number} baseAmount
   * @param {object} [criteria] - e.g. { gpa, needCategory, discountPercent }
   * @returns {{ baseAmount: number, discountAmount: number, finalAmount: number, discountType: string }}
   */
  calculate(baseAmount, criteria = {}) {
    throw new Error('Method calculate() must be implemented');
  }
}

class RegularFeeStrategy extends FeeCalculationStrategy {
  calculate(baseAmount) {
    const base = Number(baseAmount) || 0;
    return {
      baseAmount: base,
      discountAmount: 0,
      finalAmount: base,
      discountType: 'regular'
    };
  }
}

class ScholarshipFeeStrategy extends FeeCalculationStrategy {
  calculate(baseAmount, criteria = {}) {
    const base = Number(baseAmount) || 0;
    const gpa = Number(criteria.gpa) || 0;
    let discountPercent = 0;
    let discountType = 'merit_scholarship';

    if (criteria.needBased) {
      discountPercent = criteria.discountPercent !== undefined ? Number(criteria.discountPercent) : 50;
      discountType = 'need_based_scholarship';
    } else if (gpa >= 3.8) {
      discountPercent = 50; // 50% waiver for Dean's honor roll
    } else if (gpa >= 3.5) {
      discountPercent = 25; // 25% waiver for High merit
    } else if (criteria.discountPercent) {
      discountPercent = Number(criteria.discountPercent);
    }

    const discountAmount = (base * discountPercent) / 100;
    const finalAmount = Math.max(0, base - discountAmount);

    return {
      baseAmount: base,
      discountAmount,
      finalAmount,
      discountType,
      discountPercent
    };
  }
}

class FeeCalculationContext {
  constructor(strategy = new RegularFeeStrategy()) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  execute(baseAmount, criteria = {}) {
    return this.strategy.calculate(baseAmount, criteria);
  }
}

module.exports = {
  FeeCalculationStrategy,
  RegularFeeStrategy,
  ScholarshipFeeStrategy,
  FeeCalculationContext
};
