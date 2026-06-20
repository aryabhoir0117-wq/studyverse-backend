const express = require("express");
const router  = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const sa = require("../controllers/superAdminController");

const guard = [protect, requireRole("superadmin")];

router.get   ("/analytics",          ...guard, sa.getPlatformAnalytics);
router.get   ("/schools",            ...guard, sa.getAllSchools);
router.post  ("/schools",            ...guard, sa.createSchool);
router.put   ("/schools/:id",        ...guard, sa.updateSchool);
router.delete("/schools/:id",        ...guard, sa.deactivateSchool);
router.get   ("/admins",             ...guard, sa.getAllAdmins);
router.post  ("/create-admin",       ...guard, sa.createSchoolAdmin);
router.patch ("/block-admin/:id",    ...guard, sa.blockAdmin);
router.patch ("/unblock-admin/:id",  ...guard, sa.unblockAdmin);

module.exports = router;
