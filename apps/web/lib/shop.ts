export const SHOP_DISCOUNT = { percent: 10, code: 'INSIDE10' };

export function discountedPrice(price: number) {
  return Math.round(price * (100 - SHOP_DISCOUNT.percent)) / 100;
}
