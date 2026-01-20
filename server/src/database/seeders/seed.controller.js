import { seedSuperAdmin } from "./superAdminSeeder.js";
import { seedChartOfAccounts } from "../../modules/accounting/seed.accounts.js";
import { seedBranches } from "../../modules/branches/seed.branch.js";
import { seedcommissionRules } from "../../modules/sales/commission.seed.js";


export const seedAllController = async (req, res, next) => {
    try {
        const db = req.app.locals.db;

        // await seedSuperAdmin(db);
        // await seedBranches(db);
        // await seedChartOfAccounts(db);
        await seedcommissionRules(db);


        res.status(200).json({
            success: true,
            message: "All seeds executed successfully",
        });
    } catch (error) {
        next(error);
    }
};
