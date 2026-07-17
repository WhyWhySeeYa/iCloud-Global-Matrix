import { STORAGE_TIERS } from '../../shared/constants.js';

export { STORAGE_TIERS };

const countryMap = {
  '巴哈马': { iso: 'BS', en: 'Bahamas' }, '巴巴多斯': { iso: 'BB', en: 'Barbados' }, '巴西': { iso: 'BR', en: 'Brazil' }, '加拿大': { iso: 'CA', en: 'Canada' },
  '智利': { iso: 'CL', en: 'Chile' }, '哥伦比亚': { iso: 'CO', en: 'Colombia' }, '墨西哥': { iso: 'MX', en: 'Mexico' }, '秘鲁': { iso: 'PE', en: 'Peru' },
  '苏里南': { iso: 'SR', en: 'Suriname' }, '美国': { iso: 'US', en: 'United States' }, '阿尔巴尼亚': { iso: 'AL', en: 'Albania' }, '亚美尼亚': { iso: 'AM', en: 'Armenia' },
  '阿塞拜疆': { iso: 'AZ', en: 'Azerbaijan' }, '巴林': { iso: 'BH', en: 'Bahrain' }, '白俄罗斯': { iso: 'BY', en: 'Belarus' }, '贝宁': { iso: 'BJ', en: 'Benin' },
  '保加利亚': { iso: 'BG', en: 'Bulgaria' }, '喀麦隆': { iso: 'CM', en: 'Cameroon' }, '克罗地亚': { iso: 'HR', en: 'Croatia' }, '捷克': { iso: 'CZ', en: 'Czechia' },
  '丹麦': { iso: 'DK', en: 'Denmark' }, '埃及': { iso: 'EG', en: 'Egypt' }, '欧盟': { iso: 'EU', en: 'Euro Area' }, '格鲁吉亚': { iso: 'GE', en: 'Georgia' },
  '加纳': { iso: 'GH', en: 'Ghana' }, '匈牙利': { iso: 'HU', en: 'Hungary' }, '冰岛': { iso: 'IS', en: 'Iceland' }, '以色列': { iso: 'IL', en: 'Israel' },
  '科特迪瓦': { iso: 'CI', en: 'Ivory Coast' }, '肯尼亚': { iso: 'KE', en: 'Kenya' }, '莫尔多瓦': { iso: 'MD', en: 'Moldova' }, '摩尔多瓦': { iso: 'MD', en: 'Moldova', zh: '莫尔多瓦' }, '尼日利亚': { iso: 'NG', en: 'Nigeria' },
  '挪威': { iso: 'NO', en: 'Norway' }, '巴基斯坦': { iso: 'PK', en: 'Pakistan' }, '波兰': { iso: 'PL', en: 'Poland' }, '卡塔尔': { iso: 'QA', en: 'Qatar' },
  '罗马尼亚': { iso: 'RO', en: 'Romania' }, '俄罗斯': { iso: 'RU', en: 'Russia' }, '沙特阿拉伯': { iso: 'SA', en: 'Saudi Arabia' }, '塞内加尔': { iso: 'SN', en: 'Senegal' },
  '南非': { iso: 'ZA', en: 'South Africa' }, '瑞典': { iso: 'SE', en: 'Sweden' }, '瑞士': { iso: 'CH', en: 'Switzerland' }, '坦桑尼亚': { iso: 'TZ', en: 'Tanzania' },
  '土耳其': { iso: 'TR', en: 'Türkiye' }, '乌干达': { iso: 'UG', en: 'Uganda' }, '阿拉伯联合酋长国': { iso: 'AE', en: 'United Arab Emirates' }, '英国': { iso: 'GB', en: 'United Kingdom' },
  '赞比亚': { iso: 'ZM', en: 'Zambia' }, '津巴布韦': { iso: 'ZW', en: 'Zimbabwe' }, '澳大利亚': { iso: 'AU', en: 'Australia' }, '柬埔寨': { iso: 'KH', en: 'Cambodia' },
  '中国大陆': { iso: 'CN', en: 'China mainland' }, '香港': { iso: 'HK', en: 'Hong Kong' }, '印度': { iso: 'IN', en: 'India' }, '印度尼西亚': { iso: 'ID', en: 'Indonesia' },
  '日本': { iso: 'JP', en: 'Japan' }, '哈萨克斯坦': { iso: 'KZ', en: 'Kazakhstan' }, '吉尔吉斯斯坦': { iso: 'KG', en: 'Kyrgyzstan' }, '马来西亚': { iso: 'MY', en: 'Malaysia' },
  '尼泊尔': { iso: 'NP', en: 'Nepal' }, '新西兰': { iso: 'NZ', en: 'New Zealand' }, '菲律宾': { iso: 'PH', en: 'Philippines' }, '韩国': { iso: 'KR', en: 'Republic of Korea' },
  '新加坡': { iso: 'SG', en: 'Singapore' }, '台湾': { iso: 'TW', en: 'Taiwan' }, '塔吉克斯坦': { iso: 'TJ', en: 'Tajikistan' }, '泰国': { iso: 'TH', en: 'Thailand' },
  '乌兹别克斯坦': { iso: 'UZ', en: 'Uzbekistan' }, '越南': { iso: 'VN', en: 'Vietnam' }
};

const currencyMap = {
  '美元': 'USD', '巴西雷亚尔': 'BRL', '加元': 'CAD', '智利比索': 'CLP', '哥伦比亚比索': 'COP', '墨西哥比索': 'MXN', '秘鲁新索尔': 'PEN', '秘鲁索尔': 'PEN',
  '保加利亚列弗': 'BGN', '欧元': 'EUR', '捷克克朗': 'CZK', '丹麦克朗': 'DKK', '埃及镑': 'EGP', '匈牙利福林': 'HUF', '以色列新谢克尔': 'ILS',
  '尼日利亚奈拉': 'NGN', '挪威克朗': 'NOK', '巴基斯坦卢比': 'PKR', '波兰兹罗提': 'PLN', '卡塔尔里亚尔': 'QAR', '罗马尼亚列伊': 'RON',
  '俄罗斯卢布': 'RUB', '沙特里亚尔': 'SAR', '南非兰特': 'ZAR', '瑞典克朗': 'SEK', '瑞士法郎': 'CHF', '坦桑尼亚先令': 'TZS',
  '新土耳其里拉': 'TRY', '阿联酋迪拉姆': 'AED', '英镑': 'GBP', '澳元': 'AUD', '人民币': 'CNY', '港元': 'HKD', '印度卢比': 'INR',
  '印尼盾': 'IDR', '印尼卢比': 'IDR', '日元': 'JPY', '哈萨克斯坦坚戈': 'KZT', '马来西亚林吉特': 'MYR', '新西兰元': 'NZD', '菲律宾比索': 'PHP',
  '韩元': 'KRW', '新加坡元': 'SGD', '新台币': 'TWD', '泰铢': 'THB', '越南盾': 'VND'
};

const decodeHtmlEntities = (value) => value
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#0*39;|&#x0*27;|&apos;/gi, "'");

const htmlToTextLines = (html) => decodeHtmlEntities(html)
  .replace(/<script[\s\S]*?<\/script>/gi, '')
  .replace(/<style[\s\S]*?<\/style>/gi, '')
  .replace(/<(h[1-6]|p|li|br|div|section|article|ul|ol|tr|td|th)\b[^>]*>/gi, '\n')
  .replace(/<\/[^>]+>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .split('\n')
  .map((line) => line.replace(/\s+/g, ' ').trim())
  .filter(Boolean);

const calculateCnyPrice = (priceVal, currencyCode, rates) => {
  if (currencyCode === 'CNY') return priceVal;
  if (!rates[currencyCode]) return 0;
  return parseFloat((priceVal / rates[currencyCode]).toFixed(2));
};

const createCountryRecord = (countryMatch, id) => {
  const rawCountry = countryMatch[1].trim();
  const zhCurrency = countryMatch[2]?.trim() || '美元';
  const countryInfo = countryMap[rawCountry] || { iso: 'UN', en: rawCountry };
  const zhCountry = countryInfo.zh || rawCountry;
  const currencyCode = currencyMap[zhCurrency] || 'USD';

  return {
    ID: id,
    Country: countryInfo.en,
    CountryZH: zhCountry,
    CountryISO: countryInfo.iso,
    Currency: currencyCode,
    Plans: []
  };
};

const addPlan = (country, planName, rawPrice, rates, planId) => {
  if (!country || !STORAGE_TIERS.includes(planName) || country.Plans.some((plan) => plan.Name === planName)) return planId;

  const formattedRawPrice = rawPrice.replace(',', '.');
  const priceMatch = formattedRawPrice.match(/[0-9]+(?:\.[0-9]+)?/);
  if (!priceMatch) return planId;

  const priceVal = parseFloat(priceMatch[0]);
  country.Plans.push({
    ID: planId,
    Name: planName,
    Price: priceMatch[0],
    PriceInCNY: calculateCnyPrice(priceVal, country.Currency, rates)
  });

  return planId + 1;
};

export const parsePricingHtml = (htmlString, rates) => {
  const text = htmlToTextLines(htmlString).join(' ');
  const results = [];
  const seenCountries = new Set();
  let countryIdCounter = 1;
  let planIdCounter = 1;

  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const normalizePlanName = (planName) => planName.replace(/\s+/g, '');
  const countryNamePattern = Object.keys(countryMap)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|');
  const expectedCountryNames = new Set(Object.values(countryMap).map((country) => country.zh).filter(Boolean));
  const canonicalCountryCount = Object.keys(countryMap).filter((name) => !expectedCountryNames.has(name)).length;
  const currencyNamePattern = Object.keys(currencyMap)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegex)
    .join('|');
  const planNamePattern = '50\\s*GB|200\\s*GB|2\\s*TB|6\\s*TB|12\\s*TB';
  const countryBlockRegex = new RegExp(
    `(${countryNamePattern})\\s*\\d*(?:,\\d+)?\\s*(?:[（(](${currencyNamePattern})[）)]\\s*\\d*(?:,\\d+)?)?\\s*((?:${planNamePattern})\\s*[：:][\\s\\S]*?)(?=(${countryNamePattern})\\s*\\d*(?:,\\d+)?\\s*(?:[（(](?:${currencyNamePattern})[）)]\\s*\\d*(?:,\\d+)?)?\\s*(?:${planNamePattern})\\s*[：:]|$)`,
    'g'
  );
  const planSegmentRegex = /(50\s*GB|200\s*GB|2\s*TB|6\s*TB|12\s*TB)\s*[：:]\s*([^：:]+?)(?=(?:50\s*GB|200\s*GB|2\s*TB|6\s*TB|12\s*TB)\s*[：:]|$)/g;

  for (const countryMatch of text.matchAll(countryBlockRegex)) {
    const countryName = countryMatch[1].trim();
    const currencyName = countryMatch[2]?.trim() || '美元';
    const countryKey = `${countryName}-${currencyName}`;

    if (seenCountries.has(countryKey)) continue;

    const country = createCountryRecord(['', countryName, currencyName], countryIdCounter++);
    const normalizedCountryKey = `${country.CountryZH}-${country.Currency}`;

    if (seenCountries.has(normalizedCountryKey)) continue;

    for (const planMatch of countryMatch[3].matchAll(planSegmentRegex)) {
      planIdCounter = addPlan(country, normalizePlanName(planMatch[1]), planMatch[2], rates, planIdCounter);
    }

    if (country.Plans.length > 0) {
      seenCountries.add(countryKey);
      seenCountries.add(normalizedCountryKey);
      results.push(country);
    }
  }

  return results.length > canonicalCountryCount ? results.slice(0, canonicalCountryCount) : results;
};

