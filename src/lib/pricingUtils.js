export const countryCurrencyMap = {
  // North America
  US: { currency: 'USD', symbol: '$', rate: 1 },
  CA: { currency: 'CAD', symbol: 'CA$', rate: 1.36 },
  MX: { currency: 'MXN', symbol: 'MX$', rate: 17.0 },
  // Europe
  GB: { currency: 'GBP', symbol: '£', rate: 0.79 },
  DE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  FR: { currency: 'EUR', symbol: '€', rate: 0.92 },
  ES: { currency: 'EUR', symbol: '€', rate: 0.92 },
  IT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  NL: { currency: 'EUR', symbol: '€', rate: 0.92 },
  PT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  BE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  AT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  IE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  GR: { currency: 'EUR', symbol: '€', rate: 0.92 },
  FI: { currency: 'EUR', symbol: '€', rate: 0.92 },
  SE: { currency: 'SEK', symbol: 'kr', rate: 10.5 },
  NO: { currency: 'NOK', symbol: 'kr', rate: 10.8 },
  DK: { currency: 'DKK', symbol: 'kr', rate: 6.9 },
  PL: { currency: 'PLN', symbol: 'zł', rate: 4.0 },
  CZ: { currency: 'CZK', symbol: 'Kč', rate: 23.0 },
  HU: { currency: 'HUF', symbol: 'Ft', rate: 360 },
  RO: { currency: 'RON', symbol: 'lei', rate: 4.6 },
  CH: { currency: 'CHF', symbol: 'CHF', rate: 0.88 },
  RU: { currency: 'RUB', symbol: '₽', rate: 92 },
  UA: { currency: 'UAH', symbol: '₴', rate: 37 },
  TR: { currency: 'TRY', symbol: '₺', rate: 32 },
  // Asia Pacific
  IN: { currency: 'INR', symbol: '₹', rate: 83 },
  BD: { currency: 'BDT', symbol: '৳', rate: 110 },
  PK: { currency: 'PKR', symbol: '₨', rate: 280 },
  LK: { currency: 'LKR', symbol: 'Rs', rate: 320 },
  NP: { currency: 'NPR', symbol: 'रू', rate: 133 },
  CN: { currency: 'CNY', symbol: '¥', rate: 7.2 },
  JP: { currency: 'JPY', symbol: '¥', rate: 149 },
  KR: { currency: 'KRW', symbol: '₩', rate: 1330 },
  TW: { currency: 'TWD', symbol: 'NT$', rate: 31.5 },
  HK: { currency: 'HKD', symbol: 'HK$', rate: 7.8 },
  SG: { currency: 'SGD', symbol: 'S$', rate: 1.34 },
  MY: { currency: 'MYR', symbol: 'RM', rate: 4.7 },
  TH: { currency: 'THB', symbol: '฿', rate: 35 },
  VN: { currency: 'VND', symbol: '₫', rate: 24500 },
  ID: { currency: 'IDR', symbol: 'Rp', rate: 15800 },
  PH: { currency: 'PHP', symbol: '₱', rate: 56 },
  AU: { currency: 'AUD', symbol: 'A$', rate: 1.53 },
  NZ: { currency: 'NZD', symbol: 'NZ$', rate: 1.65 },
  // Middle East
  AE: { currency: 'AED', symbol: 'د.إ', rate: 3.67 },
  SA: { currency: 'SAR', symbol: '﷼', rate: 3.75 },
  QA: { currency: 'QAR', symbol: 'ق.ر', rate: 3.64 },
  KW: { currency: 'KWD', symbol: 'د.ك', rate: 0.31 },
  BH: { currency: 'BHD', symbol: 'BD', rate: 0.38 },
  OM: { currency: 'OMR', symbol: 'ر.ع.', rate: 0.38 },
  EG: { currency: 'EGP', symbol: 'E£', rate: 31 },
  IL: { currency: 'ILS', symbol: '₪', rate: 3.7 },
  // Africa
  ZA: { currency: 'ZAR', symbol: 'R', rate: 18.8 },
  NG: { currency: 'NGN', symbol: '₦', rate: 1100 },
  KE: { currency: 'KES', symbol: 'KSh', rate: 155 },
  GH: { currency: 'GHS', symbol: 'GH₵', rate: 12.5 },
  // South America
  BR: { currency: 'BRL', symbol: 'R$', rate: 4.95 },
  AR: { currency: 'ARS', symbol: '$', rate: 850 },
  CL: { currency: 'CLP', symbol: '$', rate: 950 },
  CO: { currency: 'COP', symbol: '$', rate: 4000 },
  PE: { currency: 'PEN', symbol: 'S/', rate: 3.73 },
};

export const getCurrencySymbol = (currency) => {
  const symbols = {
    USD: '$',
    BDT: '৳',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    KRW: '₩',
    SGD: 'S$',
    MYR: 'RM',
    THB: '฿',
    VND: '₫',
    IDR: 'Rp',
    PHP: '₱',
    AED: 'د.إ',
    SAR: '﷼',
    PKR: '₨',
    LKR: 'Rs',
    BRL: 'R$',
    MXN: 'MX$',
    ZAR: 'R',
    NGN: '₦',
    TRY: '₺',
    RUB: '₽',
    PLN: 'zł',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    CHF: 'CHF',
    HKD: 'HK$',
    TWD: 'NT$',
    NZD: 'NZ$',
    ILS: '₪',
  };
  return symbols[currency] || currency || '$';
};

export const calculatePrice = (basePrice, interval, discount) => {
  if (basePrice === null || basePrice === undefined) return null;
  if (basePrice === 0) return 0;
  let price = basePrice;
  if (interval === 'quarterly') {
    price = price * 0.85; // 15% OFF
  }
  if (discount) {
    if (discount.discount_type === 'percentage') {
      price = price * (1 - discount.discount_value / 100);
    } else {
      price = Math.max(0, price - discount.discount_value);
    }
  }
  return Number(price).toFixed(2).replace(/\.00$/, '');
};

export const detectLocation = async () => {
  const params = new URLSearchParams(window.location.search);
  const countryParam = params.get('country');

  if (countryParam) {
    localStorage.setItem('user_country', countryParam.toUpperCase());
    return countryParam.toUpperCase();
  }

  let userCountry = localStorage.getItem('user_country');

  // ALWAYS check timezone for BD users, but allow override if user intentionally set something else in localStorage
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!userCountry && (tz === 'Asia/Dhaka' || tz === 'Asia/Chittagong')) {
    userCountry = 'BD';
    localStorage.setItem('user_country', 'BD');
  }

  if (!userCountry) {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        if (data.country_code) {
          userCountry = data.country_code;
          localStorage.setItem('user_country', userCountry);
        }
      }
    } catch (e) {
      try {
        const response = await fetch('https://api.country.is');
        if (response.ok) {
          const data = await response.json();
          if (data.country) {
            userCountry = data.country;
            localStorage.setItem('user_country', userCountry);
          }
        }
      } catch (e2) {
        console.error('[detectLocation] All methods failed', e2);
      }
    }
  }
  return userCountry;
};

export const getUserCurrencyInfo = (countryCode) => {
  const code = (countryCode || '').trim().toUpperCase();
  return countryCurrencyMap[code] || { currency: 'USD', symbol: '$', rate: 1 };
};

export const getPriceData = (planTier, defaultPrice, defaultOldPrice, settings, userCountry) => {
  let basePrice = defaultPrice;
  let baseOldPrice = defaultOldPrice;
  let baseCurrency = 'USD';
  let baseSymbol = '$';

  // 1. Initialize base values from Admin settings if available
  const tierSettings = settings?.pricing_tiers?.[planTier];
  if (tierSettings) {
    basePrice = tierSettings.price || defaultPrice;
    baseOldPrice = tierSettings.originalPrice || defaultOldPrice;
    baseCurrency = tierSettings.currency || 'USD';
    baseSymbol = getCurrencySymbol(baseCurrency);
  }

  let price = basePrice;
  let oldPrice = baseOldPrice;
  let currency = baseCurrency;
  let symbol = baseSymbol;

  // 2. Handle regional formatting / overrides
  if (userCountry) {
    const countryIdentifier = userCountry.trim().toUpperCase();
    const userCurrencyInfo = getUserCurrencyInfo(countryIdentifier);
    const isBD = countryIdentifier === 'BD' || countryIdentifier === 'BANGLADESH';

    // Check for manual regional override from admin panel
    let regionalOverride = null;
    if (tierSettings?.regional && Array.isArray(tierSettings.regional)) {
      regionalOverride = tierSettings.regional.find((r) => {
        if (!r || !r.country) return false;
        return r.country.trim().toUpperCase() === countryIdentifier;
      });
    }

    if (regionalOverride) {
      // Priority 1: Manual Admin Override
      price = Number(regionalOverride.price);
      currency = regionalOverride.currency;
      symbol = regionalOverride.symbol || getCurrencySymbol(currency);
      if (baseOldPrice && basePrice) {
        oldPrice = Math.round((baseOldPrice / basePrice) * price);
      }
    } else if (userCurrencyInfo.currency !== 'USD') {
      // Priority 2: Automatic Conversion
      const rate = userCurrencyInfo.rate;
      const convertedPrice = basePrice * rate;

      // Round to charm pricing numbers based on currency magnitude
      if (basePrice === 0) {
        price = 0;
      } else if (rate >= 100) {
        let roundedStr =
          rate >= 1000
            ? Math.round(convertedPrice / 1000) * 1000
            : Math.round(convertedPrice / 100) * 100;
        price = Math.max(0, roundedStr - 10);
      } else if (rate >= 10) {
        price = Math.max(0, Math.round(convertedPrice / 10) * 10 - 1);
      } else {
        price = Math.floor(convertedPrice) + 0.99;
      }

      currency = userCurrencyInfo.currency;
      symbol = userCurrencyInfo.symbol;

      if (baseOldPrice) {
        const convertedOldPrice = baseOldPrice * rate;
        if (rate >= 100) {
          oldPrice =
            rate >= 1000
              ? Math.round(convertedOldPrice / 1000) * 1000
              : Math.round(convertedOldPrice / 100) * 100;
        } else if (rate >= 10) {
          oldPrice = Math.round(convertedOldPrice / 10) * 10;
        } else {
          oldPrice = Math.floor(convertedOldPrice) + 0.99;
        }
      }
    } else {
      // Fallback: Already USD or same as base
      price = basePrice;
      oldPrice = baseOldPrice;
      currency = baseCurrency;
      symbol = baseSymbol;
    }
  } else {
    // Fallback: Already USD or same as base
    price = basePrice;
    oldPrice = baseOldPrice;
    currency = baseCurrency;
    symbol = baseSymbol;
  }

  return { price, oldPrice, currency, symbol };
};
