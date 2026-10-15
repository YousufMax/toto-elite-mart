/**
 * TOTO ELITE MART - Zero-Return Loss Fraud & Fake COD Prevention Engine
 * Algorithmic risk scoring (0 - 100) specifically calibrated for Bangladesh E-Commerce & COD dynamics.
 */

export interface FraudAnalysisResult {
  riskScore: number; // 0 (Safe) to 100 (Critical Risk)
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  flags: string[];
  recommendation: 'APPROVE' | 'MANUAL_VERIFY' | 'ADVANCE_FEE_REQUIRED' | 'BLOCK';
  requiresAdvanceFee: boolean;
  advanceFeeAmount: number;
  phoneNormalized: string;
  isBlacklisted: boolean;
  isWhitelisted: boolean;
  orderHistorySummary?: {
    totalOrders: number;
    deliveredCount: number;
    cancelledCount: number;
    pendingCount: number;
  };
}

export interface FraudEvaluationInput {
  phone: string;
  name?: string;
  address: string;
  city?: string;
  zone?: string;
  subtotal: number;
  totalAmount: number;
  paymentMethod: string;
  pastOrders?: Array<{
    id: string;
    orderNumber: string;
    customerPhone: string;
    orderStatus: string;
    createdAt: string | Date;
    totalAmount: number;
  }>;
  blacklistedPhones?: string[];
  whitelistedPhones?: string[];
  settings?: {
    fraudDetectionEnabled?: boolean;
    fraudMaxCodAmount?: number;
    fraudHighRiskAdvanceFeeRequired?: boolean;
  };
}

// Bangladesh Telecom Operator Prefixes
const VALID_BD_PREFIXES = ['013', '014', '015', '016', '017', '018', '019'];

/**
 * Standardize Bangladesh phone numbers to 11 digits: e.g. "017XXXXXXXX"
 */
export function normalizeBdPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove all non-digits
  let cleaned = rawPhone.replace(/\D/g, '');
  // If starts with 880 (e.g. 88017...), strip 88
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Checks if a phone number is a valid 11-digit Bangladeshi mobile number
 */
export function isValidBdPhone(phone: string): boolean {
  const normalized = normalizeBdPhone(phone);
  if (normalized.length !== 11) return false;
  const prefix = normalized.slice(0, 3);
  return VALID_BD_PREFIXES.includes(prefix);
}

/**
 * Detect obvious gibberish or fake strings
 */
function isSuspiciousText(text: string): boolean {
  if (!text) return true;
  const lower = text.trim().toLowerCase();
  
  // Obvious test/fake words
  const fakePatterns = [
    'test',
    'fake',
    'asdf',
    'qwerty',
    '12345',
    'none',
    'null',
    'undefined',
    'na',
    'n/a',
    'no address',
    'dhaka',
    'xyz',
  ];
  if (fakePatterns.includes(lower)) return true;

  // Excessive repeating characters e.g. "aaaaa", "11111"
  if (/([a-zA-Z0-9])\1{4,}/.test(lower)) return true;

  // Too short
  if (lower.length < 8) return true;

  return false;
}

/**
 * Main Pure Fraud Risk Evaluation Engine
 */
export function evaluateOrderFraudRisk(input: FraudEvaluationInput): FraudAnalysisResult {
  const flags: string[] = [];
  let score = 0;

  const phoneNormalized = normalizeBdPhone(input.phone);
  const blacklistedList = (input.blacklistedPhones || []).map(normalizeBdPhone);
  const whitelistedList = (input.whitelistedPhones || []).map(normalizeBdPhone);

  const isBlacklisted = blacklistedList.includes(phoneNormalized);
  const isWhitelisted = whitelistedList.includes(phoneNormalized);

  // 1. Whitelist immediate pass
  if (isWhitelisted) {
    return {
      riskScore: 0,
      riskTier: 'LOW',
      flags: ['Verified Trusted Customer (Admin Whitelist)'],
      recommendation: 'APPROVE',
      requiresAdvanceFee: false,
      advanceFeeAmount: 0,
      phoneNormalized,
      isBlacklisted: false,
      isWhitelisted: true,
    };
  }

  // 2. Blacklist immediate critical alert
  if (isBlacklisted) {
    flags.push('CRITICAL: Phone number is listed in the Super Admin Fraud Blacklist');
    return {
      riskScore: 100,
      riskTier: 'HIGH',
      flags,
      recommendation: 'BLOCK',
      requiresAdvanceFee: true,
      advanceFeeAmount: input.zone === 'Outside Dhaka' ? 120 : 60,
      phoneNormalized,
      isBlacklisted: true,
      isWhitelisted: false,
    };
  }

  // 3. Phone Number Integrity
  if (!isValidBdPhone(phoneNormalized)) {
    score += 40;
    flags.push('Invalid BD phone format or unrecognized operator prefix');
  }

  // 4. Address Integrity Check
  const address = input.address || '';
  if (address.trim().length < 10) {
    score += 25;
    flags.push('Delivery address is dangerously short (< 10 characters)');
  }
  if (isSuspiciousText(address)) {
    score += 35;
    flags.push('Address appears to be gibberish, incomplete, or a placeholder');
  }

  // 5. Customer Order History Analysis
  let totalOrders = 0;
  let deliveredCount = 0;
  let cancelledCount = 0;
  let pendingCount = 0;

  if (Array.isArray(input.pastOrders) && input.pastOrders.length > 0) {
    const matchingOrders = input.pastOrders.filter(
      (o) => normalizeBdPhone(o.customerPhone) === phoneNormalized
    );
    totalOrders = matchingOrders.length;

    deliveredCount = matchingOrders.filter((o) => o.orderStatus === 'DELIVERED').length;
    cancelledCount = matchingOrders.filter((o) => o.orderStatus === 'CANCELLED').length;
    pendingCount = matchingOrders.filter((o) =>
      ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.orderStatus)
    ).length;

    // Past cancelled / rejected orders
    if (cancelledCount >= 2 && deliveredCount === 0) {
      score += 55;
      flags.push(`High Return Risk: Customer has ${cancelledCount} previous cancelled/unaccepted orders and 0 delivered`);
    } else if (cancelledCount >= 1 && deliveredCount === 0) {
      score += 30;
      flags.push('Previous order was cancelled or returned');
    } else if (totalOrders >= 2 && cancelledCount / totalOrders >= 0.5) {
      score += 40;
      flags.push(`High cancellation rate: ${cancelledCount} of ${totalOrders} past orders were cancelled`);
    }

    // Proven reliable buyer bonus
    if (deliveredCount >= 2 && cancelledCount === 0) {
      score = Math.max(0, score - 30);
      flags.push(`Trusted Buyer: ${deliveredCount} successful past deliveries`);
    }

    // 6. Velocity / Burst Spamming check (orders placed in the last 20 mins)
    const twentyMinutesAgo = Date.now() - 20 * 60 * 1000;
    const recentBurstOrders = matchingOrders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();
      return orderTime > twentyMinutesAgo;
    });

    if (recentBurstOrders.length >= 2) {
      score += 40;
      flags.push(`Velocity Warning: ${recentBurstOrders.length} orders placed in the last 20 minutes from this number`);
    }
  }

  // 7. High-Value COD Check
  const maxCod = input.settings?.fraudMaxCodAmount || 4000;
  if (input.paymentMethod === 'COD' && input.totalAmount > maxCod) {
    score += 20;
    flags.push(`High-value COD (৳${input.totalAmount.toLocaleString()} > ৳${maxCod.toLocaleString()})`);
  }

  // Clamp score 0 to 100
  const finalScore = Math.min(100, Math.max(0, score));

  // Determine Tier
  let riskTier: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (finalScore >= 60) {
    riskTier = 'HIGH';
  } else if (finalScore >= 25) {
    riskTier = 'MEDIUM';
  }

  // Determine Recommendation & Advance Fee Requirement
  const advanceFeeAmount = input.zone === 'Outside Dhaka' ? 120 : 60;
  let recommendation: 'APPROVE' | 'MANUAL_VERIFY' | 'ADVANCE_FEE_REQUIRED' | 'BLOCK' = 'APPROVE';
  let requiresAdvanceFee = false;

  const advanceRuleEnabled = input.settings?.fraudHighRiskAdvanceFeeRequired !== false;

  if (riskTier === 'HIGH') {
    if (advanceRuleEnabled && input.paymentMethod === 'COD') {
      recommendation = 'ADVANCE_FEE_REQUIRED';
      requiresAdvanceFee = true;
    } else {
      recommendation = 'MANUAL_VERIFY';
    }
  } else if (riskTier === 'MEDIUM') {
    recommendation = 'MANUAL_VERIFY';
  }

  return {
    riskScore: finalScore,
    riskTier,
    flags,
    recommendation,
    requiresAdvanceFee,
    advanceFeeAmount: requiresAdvanceFee ? advanceFeeAmount : 0,
    phoneNormalized,
    isBlacklisted: false,
    isWhitelisted: false,
    orderHistorySummary: {
      totalOrders,
      deliveredCount,
      cancelledCount,
      pendingCount,
    },
  };
}
