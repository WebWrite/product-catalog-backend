import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        entityType: {
            type: String,
            enum: ["user", "product", "category", "order", "payment"],
            required: true,
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        metadata: {
            type: string,
            default: null,
            trim: true
        },
    },
    {
        timestamps: true
    }
);

activityLogSchema.index({
    userId: 1,
});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

export default ActivityLog;