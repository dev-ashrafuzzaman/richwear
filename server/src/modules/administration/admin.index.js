// run once
db.activity_logs.createIndex({ createdAt: -1 });
db.activity_logs.createIndex({ action: 1 });
db.activity_logs.createIndex({ refType: 1 });
db.activity_logs.createIndex({ userId: 1 });
db.activity_logs.createIndex({ branchId: 1 });
