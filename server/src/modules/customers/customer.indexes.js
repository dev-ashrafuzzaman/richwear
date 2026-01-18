export const customerIndexes = [
  {
    key: { phone: 1 },
    unique: true
  },
  {
    key: { code: 1 },
    unique: true
  },
  {
    key: { name: "text", phone: "text" }
  }
];
