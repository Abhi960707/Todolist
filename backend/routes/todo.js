const router = require("express").Router();
const path = require("path");
const Todo = require("../models/Todo");
const User = require("../models/User");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");

const todoPopulate = [
    { path: "user", select: "name email" },
    { path: "assignedTo", select: "name email" },
    { path: "assignedBy", select: "name email" },
];

const toObjectIdString = (value) => value?.toString?.() || "";

const canAccessTodo = (todo, userId) => {
    const ownerId = toObjectIdString(todo.user?._id || todo.user);
    const assigneeId = toObjectIdString(todo.assignedTo?._id || todo.assignedTo);
    const isSubtaskAssignee = todo.subtasks?.some(
        (st) => toObjectIdString(st.assignedTo?._id || st.assignedTo) === userId
    );
    return ownerId === userId || assigneeId === userId || isSubtaskAssignee;
};

const isOwner = (todo, userId) => {
    const ownerId = toObjectIdString(todo.user?._id || todo.user);
    return ownerId === userId;
};

/* ─── GET all todos for current user ─────────────────────────────── */
router.get("/", auth, async (req, res) => {
    try {
        const todos = await Todo.find({
            $or: [{ user: req.user.id }, { assignedTo: req.user.id }, { "subtasks.assignedTo": req.user.id }],
        })
            .populate(todoPopulate)
            .sort({ createdAt: -1 });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch todos" });
    }
});

/* ─── GET notifications for the current user ─────────────────────── */
router.get("/notifications", auth, async (req, res) => {
    try {
        const todos = await Todo.find({
            assignedBy: req.user.id,
            assignedTo: { $ne: req.user.id },
            completed: true,
            completedAt: { $ne: null },
            completionNotifiedAt: null,
        })
            .populate(todoPopulate)
            .sort({ completedAt: -1, updatedAt: -1 });

        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch notifications" });
    }
});

/* ─── GET single todo by ID ──────────────────────────────────────── */
router.get("/:id", auth, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id).populate(todoPopulate);
        if (!todo || !canAccessTodo(todo, req.user.id)) {
            return res.status(404).json({ message: "Todo not found" });
        }
        res.json(todo);
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch todo" });
    }
});

/* ─── POST create todo (supports multipart for file upload) ──────── */
router.post("/", auth, upload.single("attachment"), async (req, res) => {
    try {
        const { title, dueDate, reminder, assignedTo, assignmentNote } = req.body;
        const cleanTitle = title?.trim();

        if (!cleanTitle) {
            return res.status(400).json({ message: "Title is required" });
        }

        let assigneeId = null;
        if (assignedTo) {
            const assignee = await User.findById(assignedTo);
            if (!assignee) {
                return res.status(404).json({ message: "Assigned user not found" });
            }
            assigneeId = assignee._id;
        }

        // Build attachment info if a file was uploaded
        let attachmentUrl = null;
        let attachmentName = null;
        if (req.file) {
            attachmentUrl = `/uploads/${req.file.filename}`;
            attachmentName = req.file.originalname;
        }

        const newTodo = new Todo({
            user: req.user.id,
            title: cleanTitle,
            dueDate: dueDate || null,
            reminder: reminder === "true" || reminder === true,
            assignedTo: assigneeId,
            assignedBy: assigneeId ? req.user.id : null,
            assignmentNote: assignmentNote?.trim() || "",
            attachmentUrl,
            attachmentName,
        });

        const saved = await newTodo.save();
        await saved.populate(todoPopulate);
        res.json(saved);
    } catch (err) {
        console.error("Create todo error:", err);
        res.status(500).json({ message: "Unable to create todo" });
    }
});

/* ─── PUT update todo ─────────────────────────────────────────────── */
router.put("/:id", auth, async (req, res) => {
    try {
        const { title, dueDate, reminder, assignedTo, assignmentNote } = req.body;
        const cleanTitle = title?.trim();

        if (!cleanTitle) {
            return res.status(400).json({ message: "Title is required" });
        }

        const todo = await Todo.findById(req.params.id);
        if (!todo || !canAccessTodo(todo, req.user.id)) {
            return res.status(404).json({ message: "Todo not found" });
        }

        if (!isOwner(todo, req.user.id)) {
            return res.status(403).json({ message: "Only the task owner can edit task details" });
        }

        todo.title = cleanTitle;
        todo.dueDate = dueDate || null;
        todo.reminder = reminder || false;

        if (assignedTo) {
            const assignee = await User.findById(assignedTo);
            if (!assignee) {
                return res.status(404).json({ message: "Assigned user not found" });
            }
            todo.assignedTo = assignee._id;
            todo.assignedBy = req.user.id;
        } else {
            todo.assignedTo = null;
            todo.assignedBy = null;
        }

        todo.assignmentNote = assignmentNote?.trim() || "";

        const updated = await todo.save();
        await updated.populate(todoPopulate);

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Unable to update todo" });
    }
});

/* ─── PATCH toggle complete / save note ─────────────────────────── */
router.patch("/:id", auth, async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);

        if (!todo || !canAccessTodo(todo, req.user.id)) {
            return res.status(404).json({ message: "Todo not found" });
        }

        if (req.body.completedAt !== undefined) {
            const isCompleting = req.body.completedAt !== null;
            todo.completed = isCompleting;
            todo.completedAt = req.body.completedAt;
            if (isCompleting && toObjectIdString(todo.assignedBy) && toObjectIdString(todo.assignedBy) !== req.user.id) {
                todo.completionNotifiedAt = null;
            }
            if (!isCompleting) {
                todo.completionNotifiedAt = null;
            }
        }

        if (req.body.note !== undefined) {
            todo.note = req.body.note;
        }

        // Allow owner to mark as done / pending from notification detail
        if (req.body.completed !== undefined) {
            todo.completed = req.body.completed;
            if (!req.body.completed) {
                todo.completedAt = null;
                todo.completionNotifiedAt = null;
                todo.note = null;
            }
        }

        if (req.body.completionNotifiedAt !== undefined) {
            todo.completionNotifiedAt = req.body.completionNotifiedAt;
        }

        const saved = await todo.save();
        await saved.populate(todoPopulate);
        res.json(saved);
    } catch (err) {
        res.status(500).json({ message: "Unable to update todo status" });
    }
});

/* ─── PATCH mark notification as read ───────────────────────────── */
router.patch("/:id/notifications/read", auth, async (req, res) => {
    try {
        const todo = await Todo.findOne({
            _id: req.params.id,
            assignedBy: req.user.id,
            completed: true,
        });

        if (!todo) {
            return res.status(404).json({ message: "Notification not found" });
        }

        todo.completionNotifiedAt = new Date();
        const saved = await todo.save();
        await saved.populate(todoPopulate);
        res.json(saved);
    } catch (err) {
        res.status(500).json({ message: "Unable to update notification" });
    }
});

/* ─── DELETE todo ────────────────────────────────────────────────── */
router.delete("/:id", auth, async (req, res) => {
    try {
        const fs = require("fs");
        const todo = await Todo.findOne({ _id: req.params.id, user: req.user.id });

        if (!todo) {
            return res.status(404).json({ message: "Todo not found" });
        }

        if (todo.attachmentUrl) {
            const filePath = path.join(__dirname, "..", todo.attachmentUrl);
            fs.unlink(filePath, (err) => {
                if (err) console.error("Error deleting local attachment file:", err);
            });
        }

        await Todo.deleteOne({ _id: req.params.id, user: req.user.id });
        res.json({ message: "Todo deleted" });
    } catch (err) {
        res.status(500).json({ message: "Unable to delete todo" });
    }
});

/* ─── GET user task details ──────────────────────────────────────── */
router.get("/user/:userId/details", auth, async (req, res) => {
    try {
        const userId = req.params.userId;

        const query = {
            $or: [
                { user: userId },
                { assignedTo: userId },
                { "subtasks.assignedTo": userId }
            ]
        };

        const todos = await Todo.find(query)
            .populate(todoPopulate)
            .sort({ createdAt: -1 });

        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: "Unable to fetch user task details" });
    }
});

module.exports = router;
