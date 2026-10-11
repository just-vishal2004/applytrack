const mongoose = require("mongoose");
const Application = require("../models/Application");

const ALLOWED_STATUSES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
];

const ALLOWED_FIELDS = [
  "company",
  "position",
  "location",
  "status",
  "appliedAt",
  "followUpAt",
  "jobUrl",
  "notes",
];

function isValidObjectId(id) {
  return mongoose.isValidObjectId(id);
}

function parseDate(value, fieldName) {
  if (value === null || value === "") {
    return { value: null };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { error: `${fieldName} must be a valid date` };
  }

  return { value: date };
}

function validateApplicationInput(body, isUpdate = false) {
  const errors = [];
  const data = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      errors: ["Request body must be a JSON object"],
      data,
    };
  }

  const unknownFields = Object.keys(body).filter(
    (field) => !ALLOWED_FIELDS.includes(field)
  );

  if (unknownFields.length > 0) {
    errors.push(`Unknown fields: ${unknownFields.join(", ")}`);
  }

  for (const field of ["company", "position"]) {
    if (!isUpdate || Object.hasOwn(body, field)) {
      const value = body[field];

      if (typeof value !== "string" || !value.trim()) {
        errors.push(`${field} is required and must be a non-empty string`);
      } else if (value.trim().length > 100) {
        errors.push(`${field} cannot exceed 100 characters`);
      } else {
        data[field] = value.trim();
      }
    }
  }

  for (const field of ["location", "notes", "jobUrl"]) {
    if (!Object.hasOwn(body, field)) continue;

    if (typeof body[field] !== "string") {
      errors.push(`${field} must be a string`);
      continue;
    }

    const value = body[field].trim();
    const maxLength = field === "notes" ? 2000 : field === "jobUrl" ? 2048 : 100;

    if (value.length > maxLength) {
      errors.push(`${field} cannot exceed ${maxLength} characters`);
      continue;
    }

    if (field === "jobUrl" && value) {
      try {
        const url = new URL(value);

        if (!["http:", "https:"].includes(url.protocol)) {
          errors.push("jobUrl must use HTTP or HTTPS");
          continue;
        }
      } catch {
        errors.push("jobUrl must be a valid URL");
        continue;
      }
    }

    data[field] = value;
  }

  if (Object.hasOwn(body, "status")) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${ALLOWED_STATUSES.join(", ")}`);
    } else {
      data.status = body.status;
    }
  }

  for (const field of ["appliedAt", "followUpAt"]) {
    if (!Object.hasOwn(body, field)) continue;

    if (field === "appliedAt" && body[field] === null) {
      errors.push("appliedAt cannot be null");
      continue;
    }

    const result = parseDate(body[field], field);

    if (result.error) {
      errors.push(result.error);
    } else {
      data[field] = result.value;
    }
  }

  return { errors, data };
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

async function listApplications(req, res) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return sendError(res, 400, "Invalid pagination parameters");
    }

    const filter = {};

    if (req.query.status) {
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return sendError(res, 400, "Invalid application status");
      }

      filter.status = req.query.status;
    }

    if (req.query.search) {
      if (
        typeof req.query.search !== "string" ||
        req.query.search.length > 100
      ) {
        return sendError(res, 400, "Search must not exceed 100 characters");
      }

      const escapedSearch = req.query.search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      if (escapedSearch) {
        filter.$or = [
          { company: { $regex: escapedSearch, $options: "i" } },
          { position: { $regex: escapedSearch, $options: "i" } },
        ];
      }
    }

    const [applications, total] = await Promise.all([
      Application.find(filter)
        .sort({ appliedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Application.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("List applications failed:", error.message);
    return sendError(res, 500, "Unable to retrieve applications");
  }
}

async function getApplication(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return sendError(res, 400, "Invalid application ID");
    }

    const application = await Application.findById(req.params.id).lean();

    if (!application) {
      return sendError(res, 404, "Application not found");
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Get application failed:", error.message);
    return sendError(res, 500, "Unable to retrieve application");
  }
}

async function createApplication(req, res) {
  const { errors, data } = validateApplicationInput(req.body);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  try {
    const application = await Application.create(data);

    return res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return sendError(res, 400, "Application validation failed");
    }

    console.error("Create application failed:", error.message);
    return sendError(res, 500, "Unable to create application");
  }
}

async function updateApplication(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return sendError(res, 400, "Invalid application ID");
  }

  const { errors, data } = validateApplicationInput(req.body, true);

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (Object.keys(data).length === 0) {
    return sendError(res, 400, "Provide at least one valid field to update");
  }

  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!application) {
      return sendError(res, 404, "Application not found");
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return sendError(res, 400, "Application validation failed");
    }

    console.error("Update application failed:", error.message);
    return sendError(res, 500, "Unable to update application");
  }
}

async function deleteApplication(req, res) {
  if (!isValidObjectId(req.params.id)) {
    return sendError(res, 400, "Invalid application ID");
  }

  try {
    const application = await Application.findByIdAndDelete(req.params.id);

    if (!application) {
      return sendError(res, 404, "Application not found");
    }

    return res.status(200).json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Delete application failed:", error.message);
    return sendError(res, 500, "Unable to delete application");
  }
}

async function getApplicationStats(req, res) {
  try {
    const [total, statusCounts] = await Promise.all([
      Application.countDocuments(),
      Application.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byStatus = Object.fromEntries(
      ALLOWED_STATUSES.map((status) => [status, 0])
    );

    for (const item of statusCounts) {
      byStatus[item._id] = item.count;
    }

    return res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
      },
    });
  } catch (error) {
    console.error("Application stats failed:", error.message);
    return sendError(res, 500, "Unable to retrieve application statistics");
  }
}

module.exports = {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationStats,
};