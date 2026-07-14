const router = require("express").Router({ mergeParams: true });
const Todo = require("../models/Todo");
const User = require("../models/User");
const auth = require("../middleware/auth");

const toStr = (v) => v?.toString?.() || "";

const canAccess = (todo, userId) => {
    const ownerId = toStr(todo.user?._id || todo.user);
    const assigneeId = toStr(todo.assignedTo?._id || todo.assignedTo);
    const isSubtaskAssignee = todo.subtasks?.some(
        (st) => toStr(st.assignedTo?._id || st.assignedTo) === userId
    );
    return ownerId === userId || assigneeId === userId || isSubtaskAssignee;
};

const isOwner = (todo, userId) => toStr(todo.user?._id || todo.user) === userId;

/* Population helper — keeps subtask assignedTo populated */
const populateTodo = (doc) =>
    doc.populate([
        { path: "user", select: "name email" },
        { path: "assignedTo", select: "name email" },
        { path: "assignedBy", select: "name email" },
        { path: "subtasks.assignedTo", select: "name email" },
    ]);

/* ── GET  /api/todo/:todoId/subtasks ─────────────────────────────── */
router.get("/", auth, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.todoId).populate("subtasks.assignedTo", "name email");
        if (!todo || !canAccess(todo, req.user.id)) {
            return res.status(404).json({ message: "Task not found" });
        }

        const ownerId = toStr(todo.user?._id || todo.user);
        const assigneeId = toStr(todo.assignedTo?._id || todo.assignedTo);
        const isParentInvolved = ownerId === req.user.id || assigneeId === req.user.id;

        let returnedSubtasks = todo.subtasks;
        if (!isParentInvolved) {
            returnedSubtasks = todo.subtasks.filter(st => toStr(st.assignedTo?._id || st.assignedTo) === req.user.id);
        }

        res.json(returnedSubtasks);
    } catch (err) {
        console.error("GET subtasks error:", err);
        res.status(500).json({ message: "Unable to fetch subtasks" });
    }
});

/* ── POST /api/todo/:todoId/subtasks ─────────────────────────────── */
router.post("/", auth, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.todoId);
        if (!todo || !canAccess(todo, req.user.id)) {
            return res.status(404).json({ message: "Task not found" });
        }
        if (!isOwner(todo, req.user.id)) {
            return res.status(403).json({ message: "Only the task owner can add subtasks" });
        }

        const title = req.body.title?.trim();
        if (!title) return res.status(400).json({ message: "Subtask title is required" });

        let assignedToId = null;
        if (req.body.assignedTo) {
            const user = await User.findById(req.body.assignedTo);
            if (!user) return res.status(404).json({ message: "Assigned user not found" });
            assignedToId = user._id;
        }

        todo.subtasks.push({ title, status: "todo", assignedTo: assignedToId });

        // Revert parent task completion status if it was completed
        if (todo.completed) {
            todo.completed = false;
            todo.completedAt = null;
            todo.completionNotifiedAt = null;
        }

        await todo.save();
        await populateTodo(todo);

        res.status(201).json(todo.subtasks[todo.subtasks.length - 1]);
    } catch (err) {
        console.error("POST subtask error:", err);
        res.status(500).json({ message: "Unable to create subtask" });
    }
});

/* ── PATCH /api/todo/:todoId/subtasks/:subtaskId/status ──────────── */
router.patch("/:subtaskId/status", auth, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["todo", "in-progress", "in-review", "done"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const todo = await Todo.findById(req.params.todoId).populate("subtasks.assignedTo", "name email");
        if (!todo || !canAccess(todo, req.user.id)) {
            return res.status(404).json({ message: "Task not found" });
        }

        const subtask = todo.subtasks.id(req.params.subtaskId);
        if (!subtask) return res.status(404).json({ message: "Subtask not found" });

        // Permission: owner can move any subtask; a sub-assignee can only move their own
        const isTaskOwner = isOwner(todo, req.user.id);
        const isSubAssignee = toStr(subtask.assignedTo?._id || subtask.assignedTo) === req.user.id;

        if (!isTaskOwner && !isSubAssignee) {
            return res.status(403).json({ message: "Not authorised to update this subtask" });
        }

        subtask.status = status;

        // Auto Progress Logic: Update parent task if all subtasks are "done"
        const allDone = todo.subtasks.every(st => st.status === "done");

        if (allDone && todo.subtasks.length > 0) {
            todo.completed = true;
            todo.completedAt = new Date();
            // Automatically notify parent assigner if assigned by someone else
            if (toStr(todo.assignedBy) && toStr(todo.assignedBy) !== req.user.id) {
                todo.completionNotifiedAt = null;
            }
        } else if (todo.completed) {
            // Revert parent from completed if a subtask is moved out of "done"
            todo.completed = false;
            todo.completedAt = null;
            todo.completionNotifiedAt = null;
        }

        await todo.save();
        await populateTodo(todo);

        res.json(subtask);
    } catch (err) {
        console.error("PATCH subtask status error:", err);
        res.status(500).json({ message: "Unable to update subtask status" });
    }
});

/* ── DELETE /api/todo/:todoId/subtasks/:subtaskId ────────────────── */
router.delete("/:subtaskId", auth, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.todoId);
        if (!todo || !canAccess(todo, req.user.id)) {
            return res.status(404).json({ message: "Task not found" });
        }
        if (!isOwner(todo, req.user.id)) {
            return res.status(403).json({ message: "Only the task owner can delete subtasks" });
        }

        const subtask = todo.subtasks.id(req.params.subtaskId);
        if (!subtask) return res.status(404).json({ message: "Subtask not found" });

        subtask.deleteOne();
        await todo.save();

        res.json({ message: "Subtask deleted" });
    } catch (err) {
        console.error("DELETE subtask error:", err);
        res.status(500).json({ message: "Unable to delete subtask" });
    }
});

module.exports = router;
