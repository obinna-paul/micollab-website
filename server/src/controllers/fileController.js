const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Configure Multer Storage for general files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, uniqueSuffix + '-' + cleanOriginalName);
  }
});

// Broad file filter - block executable files for basic security
const fileFilter = (req, file, cb) => {
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.scr', '.msi', '.com'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (blockedExtensions.includes(ext)) {
    cb(new Error('Security check failed: Executable and script files are not allowed!'), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB maximum file size
});

// Middleware for single file upload with clean error handling
const uploadSingle = upload.single('file');
exports.uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// GET /api/circles/:id/files - Fetch all files inside a circle
exports.getCircleFiles = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const userId = req.user.id;

    // 1. Verify Circle and Membership
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: { members: true }
    });

    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    const isMember = circle.members.some(m => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied: You are not a member of this Circle' });
    }

    // 2. Fetch Circle Files
    const files = await prisma.circleFile.findMany({
      where: { circleId },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Map File Uploader Details manually without migration
    const uploaderIds = [...new Set(files.map(f => f.uploadedBy))];
    const uploaders = await prisma.user.findMany({
      where: { id: { in: uploaderIds } },
      select: { id: true, username: true, profileImage: true }
    });

    const uploaderMap = uploaders.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});

    const enrichedFiles = files.map(file => ({
      ...file,
      uploader: uploaderMap[file.uploadedBy] || { username: 'Unknown', profileImage: null }
    }));

    res.json(enrichedFiles);
  } catch (error) {
    console.error('Error fetching circle files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

// POST /api/circles/:id/files - Upload a file to a circle
exports.uploadCircleFile = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file type blocked' });
    }

    // 1. Verify Circle and Membership
    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: { members: true }
    });

    if (!circle) {
      // Clean up uploaded file if circle doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Circle not found' });
    }

    const isMember = circle.members.some(m => m.userId === userId);
    if (!isMember) {
      // Clean up file
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ error: 'Access denied: You are not a member of this Circle' });
    }

    // 2. Save file record to database
    // Serve from local backend URL http://localhost:5000/uploads/...
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    
    const newFile = await prisma.circleFile.create({
      data: {
        circleId,
        uploadedBy: userId,
        fileUrl,
        type: req.file.mimetype,
        version: 1
      }
    });

    // Fetch user details to return with the file
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, profileImage: true }
    });

    res.status(201).json({
      ...newFile,
      uploader: user || { username: 'Unknown', profileImage: null }
    });
  } catch (error) {
    console.error('Error uploading circle file:', error);
    // Cleanup file if error occurs after upload
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Failed to cleanup file:', err);
      }
    }
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

// DELETE /api/circles/files/:fileId - Delete a file from the circle
exports.deleteCircleFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    // 1. Find file
    const fileRecord = await prisma.circleFile.findUnique({
      where: { id: fileId },
      include: { circle: { include: { members: true } } }
    });

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 2. Authorization check
    // Allow deletion if user is the uploader, or the Circle Owner
    const isUploader = fileRecord.uploadedBy === userId;
    const isOwner = fileRecord.circle.ownerId === userId;
    
    const userMember = fileRecord.circle.members.find(m => m.userId === userId);
    const isAdmin = userMember && userMember.role === 'ADMIN';

    if (!isUploader && !isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Permission denied: Only the uploader or Circle Owner/Admin can delete this file' });
    }

    // 3. Delete from local disk
    const filename = fileRecord.fileUrl.substring(fileRecord.fileUrl.lastIndexOf('/') + 1);
    const filePath = path.join(__dirname, '../../uploads', filename);
    
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Disk delete error (continuing database delete):', err);
      }
    }

    // 4. Delete from database
    await prisma.circleFile.delete({
      where: { id: fileId }
    });

    res.json({ message: 'File deleted successfully', fileId });
  } catch (error) {
    console.error('Error deleting circle file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};
