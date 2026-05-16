const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// POST /api/circles/:id/tasks - Create a task
exports.createTask = async (req, res) => {
  try {
    const { id: circleId } = req.params;
    const { title, description, priority, deadline, assignedTo } = req.body;
    const createdBy = req.user.id;

    const task = await prisma.circleTask.create({
      data: {
        circleId,
        title,
        description,
        priority: priority || 'MEDIUM',
        deadline: deadline ? new Date(deadline) : null,
        assignedTo: assignedTo || null,
        createdBy
      },
      include: {
        assignee: { select: { username: true, profileImage: true } }
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
    const { status, priority, assignedTo, title, description } = req.body;

    const task = await prisma.circleTask.update({
      where: { id },
      data: {
        status,
        priority,
        assignedTo,
        title,
        description
      },
      include: {
        assignee: { select: { username: true, profileImage: true } }
      }
    });

    res.json(task);
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

    const comment = await prisma.taskComment.create({
      data: { taskId, userId, content },
      include: { user: { select: { username: true, profileImage: true } } }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};
