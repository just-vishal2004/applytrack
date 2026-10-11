const express = require("express");

const {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationStats,
} = require("../controllers/applicationController");

const router = express.Router();

router.get("/stats", getApplicationStats);
router.get("/", listApplications);
router.get("/:id", getApplication);
router.post("/", createApplication);
router.patch("/:id", updateApplication);
router.delete("/:id", deleteApplication);

module.exports = router;