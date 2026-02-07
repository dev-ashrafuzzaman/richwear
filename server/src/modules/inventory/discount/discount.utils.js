// discounts/discount.utils.js

/* ================================
   Bangladesh Business Date Utils
================================ */
export const getBDNow = () => {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
    })
  );
};

export const getBDMidnight = (date = new Date()) => {
  const bd = new Date(
    new Date(date).toLocaleString("en-US", {
      timeZone: "Asia/Dhaka",
    })
  );
  bd.setHours(0, 0, 0, 0);
  return bd;
};

/* ================================
   Discount Calculation
================================ */
export const calculateDiscount = ({
  salePrice,
  type,
  value,
}) => {
  let amount = 0;

  if (type === "PERCENT") {
    amount = (salePrice * value) / 100;
  }

  if (type === "FLAT") {
    amount = value;
  }

  amount = Number(amount.toFixed(2));

  return {
    discountAmount: amount,
    finalPrice: Math.max(
      Number((salePrice - amount).toFixed(2)),
      0
    ),
  };
};
