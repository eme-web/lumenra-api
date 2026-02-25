import prisma from "../config/db.js";

export const addModuleContent = async (req, res) => {
  const { moduleId } = req.params;
  const { title, contentType, contentUrl, textContent, order } = req.body;

  try {
    // Validate module exists
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module not found",
      });
    }

    // Basic validation
    if (!title || !contentType || order === undefined) {
      return res.status(400).json({
        success: false,
        message: "Title, contentType and order are required",
      });
    }

    const content = await prisma.moduleContent.create({
      data: {
        moduleId,
        title,
        contentType,
        contentUrl,
        textContent,
        order,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Module content added successfully",
      data: content,
    });
  } catch (error) {
    console.error("Add module content error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateModuleContent = async (req, res) => {
  const { id } = req.params;
  const { title, contentType, contentUrl, textContent, order } = req.body;

  try {
    const content = await prisma.moduleContent.update({
      where: { id },
      data: {
        title,
        contentType,
        contentUrl,
        textContent,
        order,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Content updated successfully",
      data: content,
    });
  } catch (error) {
    console.error("Update module content error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getModuleContents = async (req, res) => {
  const { moduleId } = req.params;

  try {
    const contents = await prisma.moduleContent.findMany({
      where: { moduleId },
      orderBy: { order: "asc" },
    });

    return res.status(200).json({
      success: true,
      count: contents.length,
      data: contents,
    });
  } catch (error) {
    console.error("Get module contents error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const deleteModuleContent = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.moduleContent.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error("Delete module content error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
