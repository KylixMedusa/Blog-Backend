const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const keySchema = new Schema(
    {
        name: {
            type: String
        },
        type: {
            // Stores the Variable Type
            type: String,
            required: true
        },
        value: {
            // Stores the Value - Any Type
            type: Schema.Types.Mixed,
            required: false,
            default: null
        },
        endpoint: {
            type: String,
            required: false
        } // This will be dynamically generated on subscribe
    },
    {
        timestamps: true
    }
);

let Keys = mongoose.model("Keys", keySchema);

module.exports = Keys;