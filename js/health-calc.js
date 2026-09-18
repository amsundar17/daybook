// BMI, BMR/TDEE, and macro math. Pure functions, no storage/UI here -- all
// internal math uses metric (kg, cm); unit conversion happens at the edges.
const HealthCalc = (() => {
  const ACTIVITY_LEVELS = [
    { value: "sedentary", label: "Sedentary (little/no exercise)", mult: 1.2 },
    { value: "light", label: "Light (1-3 days/week)", mult: 1.375 },
    { value: "moderate", label: "Moderate (3-5 days/week)", mult: 1.55 },
    { value: "active", label: "Active (6-7 days/week)", mult: 1.725 },
    { value: "very_active", label: "Very active (2x/day, physical job)", mult: 1.9 },
  ];

  const GOALS = [
    { value: "cut", label: "Lose weight", adjust: -0.20 },
    { value: "maintain", label: "Maintain", adjust: 0 },
    { value: "bulk", label: "Gain weight", adjust: 0.15 },
  ];

  function lbToKg(lb) { return lb * 0.45359237; }
  function kgToLb(kg) { return kg / 0.45359237; }
  function inToCm(inches) { return inches * 2.54; }
  function cmToIn(cm) { return cm / 2.54; }
  function ftInToCm(ft, inches) { return inToCm(ft * 12 + inches); }
  function cmToFtIn(cm) {
    const totalIn = cmToIn(cm);
    const ft = Math.floor(totalIn / 12);
    const inches = Math.round(totalIn - ft * 12);
    return { ft, inches };
  }

  function bmi(weightKg, heightCm) {
    if (!weightKg || !heightCm) return null;
    const m = heightCm / 100;
    return weightKg / (m * m);
  }

  function bmiCategory(value) {
    if (value == null) return { label: "—", cls: "" };
    if (value < 18.5) return { label: "Underweight", cls: "p2" };
    if (value < 25) return { label: "Normal", cls: "p3" };
    if (value < 30) return { label: "Overweight", cls: "p2" };
    return { label: "Obese", cls: "p1" };
  }

  // Mifflin-St Jeor equation.
  function bmr(weightKg, heightCm, age, sex) {
    if (!weightKg || !heightCm || !age) return null;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === "female" ? base - 161 : base + 5;
  }

  function activityMultiplier(level) {
    return (ACTIVITY_LEVELS.find((a) => a.value === level) || ACTIVITY_LEVELS[2]).mult;
  }

  function tdee(bmrValue, activityLevel) {
    if (bmrValue == null) return null;
    return bmrValue * activityMultiplier(activityLevel);
  }

  function goalCalories(tdeeValue, goal) {
    if (tdeeValue == null) return null;
    const adjust = (GOALS.find((g) => g.value === goal) || GOALS[1]).adjust;
    return tdeeValue * (1 + adjust);
  }

  // proteinPerKg: grams of protein per kg bodyweight (typical 1.6-2.2).
  // fatPercent: fraction of total calories from fat (typical 0.20-0.35).
  // Carbs take whatever calories are left.
  function macros(calories, weightKg, proteinPerKg, fatPercent) {
    if (!calories || !weightKg) return null;
    const proteinG = weightKg * proteinPerKg;
    const proteinCal = proteinG * 4;
    const fatCal = calories * fatPercent;
    const fatG = fatCal / 9;
    const carbCal = Math.max(0, calories - proteinCal - fatCal);
    const carbG = carbCal / 4;
    return {
      protein: { grams: proteinG, cal: proteinCal, pct: proteinCal / calories },
      fat: { grams: fatG, cal: fatCal, pct: fatCal / calories },
      carb: { grams: carbG, cal: carbCal, pct: carbCal / calories },
    };
  }

  return {
    ACTIVITY_LEVELS, GOALS,
    lbToKg, kgToLb, inToCm, cmToIn, ftInToCm, cmToFtIn,
    bmi, bmiCategory, bmr, activityMultiplier, tdee, goalCalories, macros,
  };
})();
