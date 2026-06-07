const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/circles/:id/tasks - Create a task
exports.createTask = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const { 
      title, 
      description, 
      priority, 
      deadline, 
      assignedTo, 
      estimatedEffort, 
      labels,
      dependencies,
      linkedTasks,
      parentId
    } = req.body;
    const createdBy = req.user.id;

    // Fetch user details for log
    const user = await prisma.user.findUnique({
      where: { id: createdBy },
      select: { username: true }
    });

    // Generate custom readable Task ID
    const count = await prisma.circleTask.count({ where: { circleId } });
    const taskCode = `TASK-${String(count + 1).padStart(3, '0')}`;

    // Format fields
    const initialLog = [{
      user: `@${user?.username || 'User'}`,
      action: 'created the task',
      timestamp: new Date().toISOString()
    }];

    const task = await prisma.circleTask.create({
      data: {
        circleId,
        title,
        description,
        priority: priority || 'MEDIUM',
        deadline: deadline ? new Date(deadline) : null,
        assignedTo: assignedTo || null,
        createdBy,
        taskCode,
        estimatedEffort: estimatedEffort ? parseInt(estimatedEffort) : null,
        labels: labels || '',
        activityLog: JSON.stringify(initialLog),
        dependencies: dependencies ? JSON.stringify(dependencies) : '[]',
        linkedTasks: linkedTasks ? JSON.stringify(linkedTasks) : '[]',
        parentId: parentId || null
      },
      include: {
        assignee: { select: { username: true, profileImage: true } },
        reporter: { select: { username: true, profileImage: true } }
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// PATCH /api/tasks/:id - Update task status or info
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      priority, 
      assignedTo, 
      title, 
      description,
      estimatedEffort,
      labels,
      deadline,
      rejectionComment,
      dependencies,
      linkedTasks
    } = req.body;
    const userId = req.user.id;

    // Fetch current user and task details to compare changes
    const [user, existingTask] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { username: true } }),
      prisma.circleTask.findUnique({ 
        where: { id },
        include: { assignee: { select: { username: true } } }
      })
    ]);

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Build changes and activity log entries
    const updates = {};
    const logEntries = [];
    const username = `@${user?.username || 'User'}`;

    if (title !== undefined && title !== existingTask.title) {
      updates.title = title;
      logEntries.push({ user: username, action: `renamed task to "${title}"`, timestamp: new Date().toISOString() });
    }

    if (description !== undefined && description !== existingTask.description) {
      updates.description = description;
      logEntries.push({ user: username, action: 'updated the description', timestamp: new Date().toISOString() });
    }

    if (priority !== undefined && priority !== existingTask.priority) {
      updates.priority = priority;
      logEntries.push({ user: username, action: `changed priority from ${existingTask.priority} to ${priority}`, timestamp: new Date().toISOString() });
    }

    if (deadline !== undefined) {
      const newD = deadline ? new Date(deadline).toISOString() : null;
      const oldD = existingTask.deadline ? new Date(existingTask.deadline).toISOString() : null;
      if (newD !== oldD) {
        updates.deadline = deadline ? new Date(deadline) : null;
        logEntries.push({ user: username, action: deadline ? `changed due date to ${new Date(deadline).toLocaleDateString()}` : 'removed the due date', timestamp: new Date().toISOString() });
      }
    }

    if (estimatedEffort !== undefined && estimatedEffort !== existingTask.estimatedEffort) {
      updates.estimatedEffort = estimatedEffort ? parseInt(estimatedEffort) : null;
      logEntries.push({ user: username, action: `changed estimated effort to ${estimatedEffort} story points`, timestamp: new Date().toISOString() });
    }

    if (labels !== undefined && labels !== existingTask.labels) {
      updates.labels = labels;
      logEntries.push({ user: username, action: `updated labels to "${labels}"`, timestamp: new Date().toISOString() });
    }

    if (dependencies !== undefined) {
      updates.dependencies = JSON.stringify(dependencies);
    }

    if (linkedTasks !== undefined) {
      updates.linkedTasks = JSON.stringify(linkedTasks);
    }

    if (assignedTo !== undefined && assignedTo !== existingTask.assignedTo) {
      updates.assignedTo = assignedTo || null;
      if (assignedTo) {
        const newAssignee = await prisma.user.findUnique({ where: { id: assignedTo }, select: { username: true } });
        logEntries.push({ user: username, action: `assigned task to @${newAssignee?.username || 'user'}`, timestamp: new Date().toISOString() });
      } else {
        logEntries.push({ user: username, action: 'unassigned the task', timestamp: new Date().toISOString() });
      }
    }

    // Handle Workflow transitions and rejection validation
    if (status !== undefined && status !== existingTask.status) {
      const isRegression = 
        (existingTask.status === 'REVIEW' && (status === 'IN_PROGRESS' || status === 'TODO')) ||
        (existingTask.status === 'APPROVED' && status !== 'APPROVED');

      if (isRegression) {
        if (!rejectionComment || rejectionComment.trim() === '') {
          return res.status(400).json({ error: 'A mandatory rejection comment must be provided when sending a task back.' });
        }
        updates.rejectionComment = rejectionComment;
        logEntries.push({ 
          user: username, 
          action: `sent task back to ${status === 'IN_PROGRESS' ? 'In Progress' : 'To Do'} with reason: "${rejectionComment}"`, 
          timestamp: new Date().toISOString() 
        });

        // Add reason directly as a system comment inside the task comments thread
        await prisma.taskComment.create({
          data: {
            taskId: id,
            userId,
            content: `🚨 SENT BACK FROM REVIEW: ${rejectionComment}`
          }
        });
      } else {
        updates.rejectionComment = null; // Clear rejection if progressing normally
        logEntries.push({ user: username, action: `moved task from ${existingTask.status} to ${status}`, timestamp: new Date().toISOString() });
      }
      updates.status = status;

      // Auto-push attachments to Files Hub if task becomes APPROVED or COMPLETED
      if (status === 'APPROVED' || status === 'COMPLETED') {
        try {
          const attachments = await prisma.taskAttachment.findMany({
            where: { taskId: id }
          });
          
          if (attachments.length > 0) {
            const crypto = require('crypto');
            const getOriginalName = (fileUrl) => {
              const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
              const parts = filename.split('-');
              if (parts.length > 2) {
                return parts.slice(2).join('-');
              }
              return filename;
            };

            for (const att of attachments) {
              // Check if already in Files Hub
              const existingFile = await prisma.circleFile.findFirst({
                where: { 
                  circleId: existingTask.circleId, 
                  fileUrl: att.fileUrl 
                }
              });

              if (!existingFile) {
                const cleanName = `${existingTask.taskCode || 'TASK'}_${getOriginalName(att.fileUrl)}`;
                const accessList = '[]';
                const publicLinks = '[]';
                const versionHistory = JSON.stringify([{
                  version: 1,
                  fileUrl: att.fileUrl,
                  uploadedBy: existingTask.assignedTo || existingTask.createdBy,
                  uploaderName: 'System',
                  createdAt: new Date().toISOString(),
                  originalName: cleanName,
                  size: 0
                }]);
                const activityLog = JSON.stringify([{
                  id: crypto.randomBytes(8).toString('hex'),
                  action: 'CREATED_AUTO',
                  userId: existingTask.assignedTo || existingTask.createdBy,
                  username: 'System',
                  details: `Auto-submitted from completed task ${existingTask.taskCode}`,
                  timestamp: new Date().toISOString()
                }]);

                await prisma.circleFile.create({
                  data: {
                    circleId: existingTask.circleId,
                    uploadedBy: existingTask.assignedTo || existingTask.createdBy,
                    fileUrl: att.fileUrl,
                    type: att.type || 'application/octet-stream',
                    version: 1,
                    originalName: cleanName,
                    size: 0,
                    sourceTaskId: id,
                    versionHistory,
                    accessList,
                    publicLinks,
                    activityLog,
                    comments: '[]',
                    isDeleted: false
                  }
                });
              }
            }
            logEntries.push({ 
              user: 'System', 
              action: 'automatically pushed completed task attachments into the Circle Files Hub', 
              timestamp: new Date().toISOString() 
            });
          }
        } catch (err) {
          console.error('Error auto-pushing task attachments to Files Hub:', err);
        }
      }
    }

    // Append to existing activityLog
    let currentLogs = [];
    try {
      currentLogs = JSON.parse(existingTask.activityLog || '[]');
    } catch (e) {
      currentLogs = [];
    }
    const finalLogs = [...currentLogs, ...logEntries];
    updates.activityLog = JSON.stringify(finalLogs);

    // Perform database update
    const updatedTask = await prisma.circleTask.update({
      where: { id },
      data: updates,
      include: {
        assignee: { select: { username: true, profileImage: true } },
        reporter: { select: { username: true, profileImage: true } },
        subtasks: {
          include: {
            assignee: { select: { username: true, profileImage: true } }
          }
        },
        comments: {
          include: {
            user: { select: { username: true, profileImage: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { comments: true } }
      }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// GET /api/circles/:id/tasks - Get all tasks in a circle
exports.getCircleTasks = async (req, res) => {
  try {
    const { id: circleId } = req.params;

    const tasks = await prisma.circleTask.findMany({
      where: { circleId },
      include: {
        assignee: { select: { username: true, profileImage: true } },
        reporter: { select: { username: true, profileImage: true } },
        subtasks: {
          include: {
            assignee: { select: { username: true, profileImage: true } }
          }
        },
        comments: {
          include: {
            user: { select: { username: true, profileImage: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// POST /api/tasks/:id/comments - Add a comment to a task
exports.addTaskComment = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Fetch user for log
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true } });

    // Append history to task activity log
    const existingTask = await prisma.circleTask.findUnique({ where: { id: taskId }, select: { activityLog: true } });
    let currentLogs = [];
    try {
      currentLogs = JSON.parse(existingTask.activityLog || '[]');
    } catch (e) {
      currentLogs = [];
    }
    const commentLog = {
      user: `@${user?.username || 'User'}`,
      action: 'added a comment',
      timestamp: new Date().toISOString()
    };
    const finalLogs = [...currentLogs, commentLog];

    const [comment] = await Promise.all([
      prisma.taskComment.create({
        data: { taskId, userId, content },
        include: { user: { select: { username: true, profileImage: true } } }
      }),
      prisma.circleTask.update({
        where: { id: taskId },
        data: { activityLog: JSON.stringify(finalLogs) }
      })
    ]);

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};
