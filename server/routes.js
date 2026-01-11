// GET /customers?search=rahim&status=active&page=1&limit=10
// GET /customers?search=rahim
// GET /customers?status=active
// GET /customers?page=2&limit=20
// GET /customers?sortBy=name&sort=asc


// router.get(
//   "/",
//   getAll({
//     collection: COLLECTIONS.CUSTOMERS,
//     searchableFields: ["name", "phone"],
//     filterableFields: ["status"],
//     projection: { name: 1, phone: 1, dueAmount: 1 }
//   })
// );
