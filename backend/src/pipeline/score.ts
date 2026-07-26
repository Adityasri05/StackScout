import { VendorDossier } from './extract.js';
import { RequirementSpec, ScoreConfig } from '../types.js';

// Weights for the overall score calculation
const WEIGHTS = {
  fit: 0.40,
  pricing: 0.25,
  compliance: 0.20,
  docsQuality: 0.15
};

export function calculateScores(
  dossier: VendorDossier,
  spec: RequirementSpec,
  successPagesCount: number
): ScoreConfig {
  
  // 1. Fit Score: Average score of must-haves
  // yes=100, partial=50, unknown=25, no=0
  const mustHaves = spec.mustHaves || [];
  let fitScore = 100;
  if (mustHaves.length > 0) {
    let totalFitVal = 0;
    mustHaves.forEach(mh => {
      // Find matching feature claim in dossier
      const claim = dossier.features.find(f => f.name.toLowerCase() === mh.toLowerCase());
      if (claim) {
        if (claim.supported === 'yes') totalFitVal += 1.0;
        else if (claim.supported === 'partial') totalFitVal += 0.5;
        else if (claim.supported === 'unknown') totalFitVal += 0.25;
        // supported === 'no' adds 0
      } else {
        totalFitVal += 0.25; // default to unknown if not mapped
      }
    });
    fitScore = Math.round((totalFitVal / mustHaves.length) * 100);
  }

  // 2. Pricing Score: Lowest tier price vs budget
  let pricingScore = 100;
  if (spec.budgetPerMonthUSD !== null) {
    const budget = spec.budgetPerMonthUSD;
    
    // Find lowest tier price
    const activeTiers = dossier.pricing.tiers || [];
    if (activeTiers.length > 0) {
      const prices = activeTiers.map(t => t.pricePerMonthUSD);
      const lowestPrice = Math.min(...prices);
      
      if (lowestPrice <= budget) {
        pricingScore = 100;
      } else {
        // Linear deduction: 0 score if price is double the budget
        const excessPercent = (lowestPrice - budget) / budget;
        pricingScore = Math.round(Math.max(0, 100 - excessPercent * 100));
      }
    } else {
      // Custom/unknown pricing model
      if (dossier.pricing.model === 'custom' || dossier.pricing.model === 'unknown') {
        pricingScore = 50; // standard neutral rating for unlisted pricing
      } else {
        pricingScore = 100;
      }
    }
  }

  // 3. Compliance Score: Match against constraints (e.g. EU data residency, SOC2, GDPR, HIPAA)
  const constraints = spec.constraints || [];
  let complianceScore = 100;
  if (constraints.length > 0) {
    let metConstraints = 0;
    constraints.forEach(c => {
      const text = c.toLowerCase();
      
      if (text.includes('soc2') || text.includes('soc 2')) {
        if (dossier.compliance.soc2 === 'yes') metConstraints += 1.0;
        else if (dossier.compliance.soc2 === 'unknown') metConstraints += 0.5;
      } else if (text.includes('gdpr')) {
        if (dossier.compliance.gdpr === 'yes') metConstraints += 1.0;
        else if (dossier.compliance.gdpr === 'unknown') metConstraints += 0.5;
      } else if (text.includes('hipaa')) {
        if (dossier.compliance.hipaa === 'yes') metConstraints += 1.0;
        else if (dossier.compliance.hipaa === 'unknown') metConstraints += 0.5;
      } else if (text.includes('eu') || text.includes('residency') || text.includes('storage') || text.includes('location')) {
        // check dataResidency list
        const hasEU = dossier.compliance.dataResidency.some(r => 
          r.toLowerCase().includes('eu') || 
          r.toLowerCase().includes('frankfurt') || 
          r.toLowerCase().includes('dublin') || 
          r.toLowerCase().includes('germany') || 
          r.toLowerCase().includes('ireland')
        );
        if (hasEU) metConstraints += 1.0;
        else if (dossier.compliance.dataResidency.length > 0) metConstraints += 0.5;
      } else {
        // generic match - default to pass if no specific column applies
        metConstraints += 1.0;
      }
    });
    complianceScore = Math.round((metConstraints / constraints.length) * 100);
  }

  // 4. Docs Quality: pages successfully scraped vs expected (6)
  const expectedPages = 6;
  const docsQuality = Math.round(Math.min(100, (successPagesCount / expectedPages) * 100));

  // 5. Overall Score
  const overall = Math.round(
    fitScore * WEIGHTS.fit +
    pricingScore * WEIGHTS.pricing +
    complianceScore * WEIGHTS.compliance +
    docsQuality * WEIGHTS.docsQuality
  );

  return {
    fit: fitScore,
    pricing: pricingScore,
    compliance: complianceScore,
    docsQuality,
    overall
  };
}
