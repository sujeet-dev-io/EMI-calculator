/**
 * EMI Calculator — Application Logic
 * Author: Sujeet Prajapati
 *
 * Uses the standard EMI formula:
 *   EMI = [P × R × (1+R)^N] / [(1+R)^N − 1]
 *
 * Where:
 *   P = Principal loan amount
 *   R = Monthly interest rate (annual rate / 12 / 100)
 *   N = Total number of monthly instalments (years × 12)
 */

(function () {
  'use strict';

  // ---- DOM References ----
  const form            = document.getElementById('emi-form');
  const btnReset        = document.getElementById('btn-reset');
  const resultsSection  = document.getElementById('results-section');

  // Inputs
  const inputLoanAmount  = document.getElementById('loan-amount');
  const inputInterestRate = document.getElementById('interest-rate');
  const inputLoanTenure  = document.getElementById('loan-tenure');

  // Error spans
  const errorLoanAmount  = document.getElementById('loan-amount-error');
  const errorInterestRate = document.getElementById('interest-rate-error');
  const errorTenure      = document.getElementById('tenure-error');

  // Result elements
  const elMonthlyEMI    = document.getElementById('monthly-emi');
  const elTotalInterest = document.getElementById('total-interest');
  const elTotalAmount   = document.getElementById('total-amount');

  // Breakdown bar
  const barPrincipal    = document.getElementById('bar-principal');
  const barInterest     = document.getElementById('bar-interest');
  const legendPrincipal = document.getElementById('legend-principal-val');
  const legendInterest  = document.getElementById('legend-interest-val');

  // Summary
  const sumPrincipal = document.getElementById('sum-principal');
  const sumRate      = document.getElementById('sum-rate');
  const sumTenure    = document.getElementById('sum-tenure');
  const sumMonths    = document.getElementById('sum-months');
  const sumEMI       = document.getElementById('sum-emi');
  const sumInterest  = document.getElementById('sum-interest');
  const sumTotal     = document.getElementById('sum-total');


  // ---- Utility: Format as Indian Rupees ----
  function formatINR(amount) {
    // Use Intl for ₹ formatting with Indian grouping (lakh, crore)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  }


  // ---- Validation ----

  /**
   * Validates a single field and displays the appropriate error message.
   * Returns true if valid, false otherwise.
   */
  function validateField(input, errorEl, rules) {
    const raw = input.value.trim();
    const group = input.closest('.form-group');

    // Clear previous error
    group.classList.remove('has-error');
    errorEl.textContent = '';

    // Required check
    if (raw === '') {
      group.classList.add('has-error');
      errorEl.textContent = rules.requiredMsg || 'This field is required.';
      return false;
    }

    const value = parseFloat(raw);

    // Must be a valid number
    if (isNaN(value)) {
      group.classList.add('has-error');
      errorEl.textContent = 'Please enter a valid number.';
      return false;
    }

    // No negative values
    if (value <= 0) {
      group.classList.add('has-error');
      errorEl.textContent = rules.positiveMsg || 'Value must be greater than zero.';
      return false;
    }

    // Max check
    if (rules.max !== undefined && value > rules.max) {
      group.classList.add('has-error');
      errorEl.textContent = rules.maxMsg || ('Maximum allowed value is ' + rules.max + '.');
      return false;
    }

    return true;
  }

  /**
   * Validates all three fields. Returns true if all pass.
   */
  function validateAll() {
    const v1 = validateField(inputLoanAmount, errorLoanAmount, {
      requiredMsg: 'Please enter the loan amount.',
      positiveMsg: 'Loan amount must be greater than ₹0.',
    });

    const v2 = validateField(inputInterestRate, errorInterestRate, {
      requiredMsg: 'Please enter the annual interest rate.',
      positiveMsg: 'Interest rate must be greater than 0%.',
      max: 100,
      maxMsg: 'Interest rate cannot exceed 100%.',
    });

    const v3 = validateField(inputLoanTenure, errorTenure, {
      requiredMsg: 'Please enter the loan tenure in years.',
      positiveMsg: 'Tenure must be at least 1 year.',
      max: 40,
      maxMsg: 'Tenure cannot exceed 40 years.',
    });

    return v1 && v2 && v3;
  }


  // ---- EMI Calculation ----

  /**
   * Calculates EMI using the standard formula.
   * @param {number} principal - Loan amount
   * @param {number} annualRate - Annual interest rate in %
   * @param {number} tenureYears - Loan tenure in years
   * @returns {{ emi: number, totalAmount: number, totalInterest: number }}
   */
  function calculateEMI(principal, annualRate, tenureYears) {
    const monthlyRate = annualRate / 12 / 100;
    const totalMonths = tenureYears * 12;

    let emi;

    if (monthlyRate === 0) {
      // Edge case: 0% interest (shouldn't happen with validation, but safe)
      emi = principal / totalMonths;
    } else {
      // Standard EMI formula: P × R × (1+R)^N / ((1+R)^N - 1)
      const factor = Math.pow(1 + monthlyRate, totalMonths);
      emi = (principal * monthlyRate * factor) / (factor - 1);
    }

    const totalAmount = emi * totalMonths;
    const totalInterest = totalAmount - principal;

    return {
      emi: emi,
      totalAmount: totalAmount,
      totalInterest: totalInterest,
    };
  }


  // ---- Display Results ----

  function showResults(principal, annualRate, tenureYears, result) {
    const totalMonths = Math.round(tenureYears * 12);

    // Primary results
    elMonthlyEMI.textContent = formatINR(result.emi);
    elTotalInterest.textContent = formatINR(result.totalInterest);
    elTotalAmount.textContent = formatINR(result.totalAmount);

    // Pulse animation on EMI value
    elMonthlyEMI.classList.remove('pulse');
    // Trigger reflow to restart animation
    void elMonthlyEMI.offsetWidth;
    elMonthlyEMI.classList.add('pulse');

    // Breakdown bar
    const principalPct = (principal / result.totalAmount) * 100;
    const interestPct = 100 - principalPct;
    barPrincipal.style.width = principalPct.toFixed(1) + '%';
    barInterest.style.width = interestPct.toFixed(1) + '%';

    // Legend values
    legendPrincipal.textContent = formatINR(principal);
    legendInterest.textContent = formatINR(result.totalInterest);

    // Summary card
    sumPrincipal.textContent = formatINR(principal);
    sumRate.textContent = annualRate + '%';
    sumTenure.textContent = tenureYears + (tenureYears === 1 ? ' Year' : ' Years');
    sumMonths.textContent = totalMonths;
    sumEMI.textContent = formatINR(result.emi);
    sumInterest.textContent = formatINR(result.totalInterest);
    sumTotal.textContent = formatINR(result.totalAmount);

    // Reveal results card
    resultsSection.classList.remove('hidden');
    resultsSection.classList.add('visible');

    // Scroll results into view on mobile
    if (window.innerWidth < 768) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function hideResults() {
    resultsSection.classList.remove('visible');
    resultsSection.classList.add('hidden');
  }


  // ---- Clear Error on Input ----
  function attachLiveValidation(input, errorEl) {
    input.addEventListener('input', function () {
      const group = input.closest('.form-group');
      if (group.classList.contains('has-error')) {
        group.classList.remove('has-error');
        errorEl.textContent = '';
      }
    });
  }

  attachLiveValidation(inputLoanAmount, errorLoanAmount);
  attachLiveValidation(inputInterestRate, errorInterestRate);
  attachLiveValidation(inputLoanTenure, errorTenure);


  // ---- Event Handlers ----

  // Calculate
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!validateAll()) {
      // Focus first invalid field
      const firstError = form.querySelector('.form-group.has-error .form-input');
      if (firstError) firstError.focus();
      return;
    }

    const principal   = parseFloat(inputLoanAmount.value);
    const annualRate  = parseFloat(inputInterestRate.value);
    const tenureYears = parseFloat(inputLoanTenure.value);

    const result = calculateEMI(principal, annualRate, tenureYears);
    showResults(principal, annualRate, tenureYears, result);
  });

  // Reset
  btnReset.addEventListener('click', function () {
    // Clear inputs
    inputLoanAmount.value = '';
    inputInterestRate.value = '';
    inputLoanTenure.value = '';

    // Clear errors
    [inputLoanAmount, inputInterestRate, inputLoanTenure].forEach(function (input) {
      input.closest('.form-group').classList.remove('has-error');
    });
    errorLoanAmount.textContent = '';
    errorInterestRate.textContent = '';
    errorTenure.textContent = '';

    // Hide results
    hideResults();

    // Focus first field
    inputLoanAmount.focus();
  });

})();
