const mongoose = require("mongoose");

const SubtaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ["todo", "in-progress", "in-review", "done"],
            default: "todo",
        },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true }
);

const TodoSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        dueDate: { type: Date, default: null },
        reminder: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        assignmentNote: { type: String, trim: true, default: "" },
        note: { type: String, trim: true, default: "" },
        attachmentUrl: { type: String, default: null },
        attachmentName: { type: String, default: null },
        completionNotifiedAt: { type: Date, default: null },
        subtasks: { type: [SubtaskSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Todo", TodoSchema);
