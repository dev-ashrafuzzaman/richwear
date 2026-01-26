
import { seedChartOfAccounts } from "../../modules/accounting/seed.accounts.js";
import { seedBranches } from "../../modules/branches/seed.branch.js";
import { seedcommissionRules } from "../../modules/sales/commission.seed.js";
import { seedAttributes } from "../../modules/variants/seed.attributes.js";
import { seedProductTypes } from "../../modules/products/productType.seed.js";
import { seedRoles } from "../../modules/roles/seed.roles.js";
import { seedSystemUsers } from "../../modules/users/user.seed.js";

export const seedAllController = async (req, res, next) => {

    try {
        const db = req.app.locals.db;

         await seedSystemUsers(db);
        // await seedBranches(db);
        // await seedChartOfAccounts(db);
        // await seedAttributes(db);
        // await seedcommissionRules(db);
        //  await seedProductTypes(db);
        //  await seedRoles(db);


        res.status(200).json({
            success: true,
            message: "All seeds executed successfully",
        });
    } catch (error) {
        next(error);
    }
};
