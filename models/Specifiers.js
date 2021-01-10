const mongoose = require("mongoose");
const { schema } = require("./Keys");
const Schema = mongoose.Schema;

const specifierSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    key_id: {
        type: String,
        required: true
    },
    endpoint_public: {
        type: String,
        required: false,
        default: null
    },
    description: {
        type: String,
        required: false,
        default: ''
    }
}, {
    timestamps: true
});

let Specifiers = mongoose.model("Specifiers", specifierSchema);

module.exports = Specifiers;