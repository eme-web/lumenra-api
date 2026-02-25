import prisma from "../config/db.js";

export const createModule = async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      image,
      type,
      authorType,
      categoryId,
    } = req.body;

    // Basic validation
    if (
      !title ||
      !description ||
      !duration ||
      !type ||
      !authorType ||
      !categoryId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Ensure category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const module = await prisma.module.create({
      data: {
        title,
        description,
        duration,
        image,
        type,
        authorType,
        categoryId,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Module created successfully",
      data: module,
    });
  } catch (error) {
    console.error("Create module error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateModule = async (req, res) => {
  const { id } = req.params;

  try {
    const updated = await prisma.module.update({
      where: { id },
      data: req.body,
    });

    return res.status(200).json({
      success: true,
      message: "Module updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Update module error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteModule = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.module.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Module deleted successfully",
    });
  } catch (error) {
    console.error("Delete module error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get All Modules (With Filters)
export const getModules = async (req, res) => {
  try {
    const { category, type } = req.query;

    const where = {};

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = {
        name: category,
      };
    }

    const modules = await prisma.module.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: modules.length,
      data: modules,
    });
  } catch (error) {
    console.error("Get modules error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Single Module (with User Progress)
export const getModuleById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const module = await prisma.module.findUnique({
      where: { id },
      include: {
        contents: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    const progress = await prisma.userModuleProgress.findFirst({
      where: {
        userId,
        moduleId: id,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        ...module,
        progress: progress || null,
      },
    });
  } catch (error) {
    console.error("Get module error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Creates a progress record if it doesn't exit
export const startModule = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const existing = await prisma.userModuleProgress.findFirst({
      where: { userId, moduleId: id },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Module already started",
        data: existing,
      });
    }

    const progress = await prisma.userModuleProgress.create({
      data: {
        userId,
        moduleId: id,
        progress: 0,
        completed: false,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Module started",
      data: progress,
    });
  } catch (error) {
    console.error("Start module error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update progress
export const updateProgress = async (req, res) => {
  const { id } = req.params;
  const { progress } = req.body;
  const userId = req.user.id;

  if (progress < 0 || progress > 100) {
    return res.status(400).json({
      success: false,
      message: "Progress must be between 0 and 100",
    });
  }

  try {
    const updated = await prisma.userModuleProgress.updateMany({
      where: {
        userId,
        moduleId: id,
      },
      data: {
        progress,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Progress updated",
      data: updated,
    });
  } catch (error) {
    console.error("Update progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// complete module
export const completeModule = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const updated = await prisma.userModuleProgress.updateMany({
      where: {
        userId,
        moduleId: id,
      },
      data: {
        completed: true,
        progress: 100,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Module completed successfully",
    });
  } catch (error) {
    console.error("Complete module error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// user  progress dashboard
export const getUserProgress = async (req, res) => {
  const userId = req.user.id;

  try {
    const totalModules = await prisma.module.count();

    const completedModules = await prisma.userModuleProgress.count({
      where: {
        userId,
        completed: true,
      },
    });

    const progressRecords = await prisma.userModuleProgress.findMany({
      where: { userId },
      include: {
        module: true,
      },
    });

    const percentage =
      totalModules === 0
        ? 0
        : Math.round((completedModules / totalModules) * 100);

    return res.status(200).json({
      success: true,
      data: {
        totalModules,
        completedModules,
        percentage,
        modules: progressRecords,
      },
    });
  } catch (error) {
    console.error("User progress error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
