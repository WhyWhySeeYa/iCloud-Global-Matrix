import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parsePricingHtml, STORAGE_TIERS } from '../api/lib/pricing-parser.js';

const fixtureUrl = new URL('./fixtures/apple-pricing-sample.html', import.meta.url);

test('解析国家、套餐、空格容量和逗号小数', async () => {
  const html = await readFile(fixtureUrl, 'utf8');
  const data = parsePricingHtml(html, {
    USD: 0.14,
    EUR: 0.12
  });

  assert.equal(data.length, 3);

  const unitedStates = data.find((country) => country.CountryISO === 'US');
  assert.deepEqual(unitedStates.Plans.map((plan) => plan.Name), STORAGE_TIERS);
  assert.equal(unitedStates.Plans[0].Price, '0.99');
  assert.equal(unitedStates.Plans[0].PriceInCNY, 7.07);

  const euroArea = data.find((country) => country.CountryISO === 'EU');
  assert.equal(euroArea.Currency, 'EUR');
  assert.equal(euroArea.Plans[0].Price, '0.99');
  assert.equal(euroArea.Plans[0].PriceInCNY, 8.25);

  const china = data.find((country) => country.CountryISO === 'CN');
  assert.equal(china.Plans.at(-1).PriceInCNY, 398);
});

test('忽略脚本样式、重复套餐和无法识别的地区', () => {
  const html = `
    <script>美国（美元） 50GB：999</script>
    <style>中国大陆（人民币） 50GB：999</style>
    <h3>日本（日元）</h3>
    <p>50GB：150 日元</p>
    <p>50GB：999 日元</p>
    <h3>未知地区（美元）</h3>
    <p>50GB：0.01</p>
  `;

  const data = parsePricingHtml(html, { JPY: 20 });

  assert.equal(data.length, 1);
  assert.equal(data[0].CountryISO, 'JP');
  assert.equal(data[0].Plans.length, 1);
  assert.equal(data[0].Plans[0].Price, '150');
  assert.equal(data[0].Plans[0].PriceInCNY, 7.5);
});

test('汇率缺失时保留原始价格并将人民币价格标记为零', () => {
  const html = '<h3>韩国（韩元）</h3><p>50GB：1100 韩元</p>';
  const [country] = parsePricingHtml(html, {});

  assert.equal(country.Plans[0].Price, '1100');
  assert.equal(country.Plans[0].PriceInCNY, 0);
});

test('无有效价格内容时返回空数组', () => {
  assert.deepEqual(parsePricingHtml('<main>暂无价格</main>', {}), []);
});

test('兼容地区和货币别名并去除重复地区', () => {
  const html = `
    <h3>摩尔多瓦（欧元）</h3><p>50GB：0,99</p>
    <h3>莫尔多瓦（欧元）</h3><p>50GB：1,99</p>
    <h3>秘鲁（秘鲁索尔）</h3><p>50GB：2.90</p>
    <h3>印度尼西亚（印尼卢比）</h3><p>50GB：15000</p>
  `;

  const data = parsePricingHtml(html, { EUR: 0.12, PEN: 0.5, IDR: 2200 });

  assert.equal(data.filter((country) => country.CountryISO === 'MD').length, 1);
  assert.equal(data.find((country) => country.CountryISO === 'PE').Currency, 'PEN');
  assert.equal(data.find((country) => country.CountryISO === 'ID').Currency, 'IDR');
});

test('兼容英文冒号、HTML 实体和套餐脚注', () => {
  const html = `
    <h3>美国4（美元）</h3>
    <p>50GB:&nbsp;US$0.99</p>
    <p>200GB: US$2.99</p>
  `;

  const [country] = parsePricingHtml(html, { USD: 0.14 });

  assert.equal(country.CountryISO, 'US');
  assert.deepEqual(country.Plans.map((plan) => plan.Name), ['50GB', '200GB']);
});
