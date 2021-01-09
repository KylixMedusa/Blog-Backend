const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    enabled: {
        type: Boolean,
        default: false
    },
    is_admin: {
        type: Boolean,
        default: false
    },
    user_secret: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});


userSchema.pre("save", async function (next) {
    if (!this.isModified || !this.isNew) {
        next();
    } else this.isModified("password");
    if (this.password)
        this.password = await bcrypt.hash(String(this.password), 12);
    next();
});

let Users = mongoose.model("Users", userSchema);

module.exports = Users;