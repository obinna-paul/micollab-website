const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helpers to verify membership & role
const checkCircleMembership = async (circleId, userId) => {
  const membership = await prisma.circleMember.findUnique({
    where: {
      circleId_userId: { circleId, userId }
    }
  });
  return membership;
};

const isCircleAdmin = async (circleId, userId) => {
  const circle = await prisma.circle.findUnique({
    where: { id: circleId }
  });
  if (!circle) return false;
  if (circle.ownerId === userId) return true;

  const member = await checkCircleMembership(circleId, userId);
  return member && member.role === 'ADMIN';
};

// GET /api/circles/:id/folders - Get all folders in a Circle
exports.getCircleFolders = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const userId = req.user.id;

    const isMember = await checkCircleMembership(circleId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this Circle' });
    }

    const folders = await prisma.circleFolder.findMany({
      where: { circleId },
      include: {
        files: {
          where: { isDeleted: false }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};

// POST /api/circles/:id/folders - Create a folder
exports.createFolder = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const userId = req.user.id;
    const { name, parentId, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    const isMember = await checkCircleMembership(circleId, userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this Circle' });
    }

    // Verify parent if provided
    if (parentId) {
      const parentFolder = await prisma.circleFolder.findUnique({
        where: { id: parentId }
      });
      if (!parentFolder || parentFolder.circleId !== circleId) {
        return res.status(400).json({ error: 'Invalid parent folder' });
      }
    }

    const newFolder = await prisma.circleFolder.create({
      data: {
        circleId,
        name: name.trim(),
        parentId: parentId || null,
        color: color || '#3b82f6',
        icon: icon || 'folder',
        folderAccess: '[]' // Initially empty, inherits from parent or default
      }
    });

    res.status(201).json(newFolder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
};

// PUT /api/folders/:folderId - Update folder details or move it
exports.updateFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user.id;
    const { name, parentId, color, icon, folderAccess } = req.body;

    const folder = await prisma.circleFolder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const isAdmin = await isCircleAdmin(folder.circleId, userId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Permission denied: Only Admins can modify folders' });
    }

    // Circular dependency check if moving folder
    if (parentId) {
      if (parentId === folderId) {
        return res.status(400).json({ error: 'A folder cannot be its own parent' });
      }
      
      // Check recursive children
      let currentParentId = parentId;
      while (currentParentId) {
        const parent = await prisma.circleFolder.findUnique({
          where: { id: currentParentId },
          select: { id: true, parentId: true }
        });
        if (parent && parent.parentId === folderId) {
          return res.status(400).json({ error: 'Cannot move folder inside its own child folder' });
        }
        currentParentId = parent ? parent.parentId : null;
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (parentId !== undefined) updateData.parentId = parentId || null;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (folderAccess !== undefined) {
      // Validate folderAccess is JSON parsable array
      try {
        const parsed = JSON.parse(folderAccess);
        if (!Array.isArray(parsed)) throw new Error('Not an array');
        updateData.folderAccess = folderAccess;
      } catch (err) {
        return res.status(400).json({ error: 'folderAccess must be a JSON array string' });
      }
    }

    const updatedFolder = await prisma.circleFolder.update({
      where: { id: folderId },
      data: updateData
    });

    res.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
};

// Helper for recursive folder files trashing
const trashFolderContentsRecursively = async (folderId, userId) => {
  // Get all files directly inside folder
  await prisma.circleFile.updateMany({
    where: { folderId, isDeleted: false },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });

  // Find subfolders
  const subfolders = await prisma.circleFolder.findMany({
    where: { parentId: folderId }
  });

  for (const sub of subfolders) {
    await trashFolderContentsRecursively(sub.id, userId);
  }
};

// DELETE /api/folders/:folderId - Delete folder and recursively trash files
exports.deleteFolder = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user.id;

    const folder = await prisma.circleFolder.findUnique({
      where: { id: folderId }
    });

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    const isAdmin = await isCircleAdmin(folder.circleId, userId);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Permission denied: Only Admins can delete folders' });
    }

    // 1. Move all nested files inside this folder and subfolders to Trash
    await trashFolderContentsRecursively(folderId, userId);

    // 2. Delete the folders from the database
    // Prisma cascade delete will automatically remove child folders if set in schema.
    // However, SQLite Cascade delete is reliable via onDelete: Cascade relations.
    await prisma.circleFolder.delete({
      where: { id: folderId }
    });

    res.json({ message: 'Folder deleted and all files moved to Trash successfully', folderId });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
};
