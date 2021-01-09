const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const deviceSchema = new Schema(
    {
        device_id: {
            // It can be the chip ID or anything that the device can be used to uniquely identified
            type: String,
            required: true,
            unique: true
        },
        name: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: false,
            default: null
        },
        type: {
            // Stores the Device Type
            type: String,
            required: true
        },
        description: {
            // Stores the Device Description
            type: String,
            required: false,
            default: null
        },
        endpoint: {
            type: String,
            required: false,
            default: null
        }, // This will be dynamically generated on subscribe
        is_active: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

let Devices = mongoose.model("Devices", deviceSchema);

module.exports = Devices;