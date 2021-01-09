const jwt = require("jsonwebtoken");
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const Keys = require('../models/Keys');
const Users = require('../models/Users');
// const Specifiers = require('../models/Specifiers');
const startTime = new Date();

const secret_key = process.env.SECRET || "supersecretkeyrembertohide";
const verifyToken = require("../middlewares/verifyToken.js");

const jwt_headers = {
    algorithm: "HS256",
    expiresIn: 6666666,
};

router.get("/", async (req, res) => {
    return res.status(200).send(`Realtime API Running Successfully.<br/><br/>Last refresh at ${startTime}`);
});

router.post("/", async (req, res) => {
    return res.status(200).json({
        "status": "Running",
        startTime
    });
})

// router.post("/login", catchErrors(userController.login));

router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    // let user_id = get_random(12).toLowerCase();
    try {
        if (password.length < 6) throw new Error("Password must be atleast 6 characters long.");

        const userExists = await Users.findOne({ email });
        if (userExists) throw new Error("User with same email already exits.");

        const newUser = new Users({ name, email, password });
        const accessToken = jwt.sign(
            { email: newUser.email, user_id: newUser._id },
            secret_key,
            jwt_headers
        );

        const user = await newUser.save().catch(err => {
            return res.status(500).json({
                "message": "Failed",
                "additional_text": err
            });
        });
        if (user) {
            return res.status(200).json({
                message: "User Created",
                token: accessToken,
                email: newUser.email,
            });
        } else throw new Error("User creation failed");
    } catch (e) {
        return res.status(500).json({ message: "Internal Server Errror", e });
    }
});


router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const findUser = await Users.findOne({ email });

    if (findUser) {
        if (await bcrypt.compare(password, findUser.password)) {
            const accessToken = jwt.sign(
                { email: findUser.email, user_id: newUser._id },
                secret_key,
                jwt_headers
            );
            return res.status(200).json({
                message: "Login Success",
                token: accessToken,
                email: findUser.email,
            });
        } else
            return res.status(400).json({ message: "Authentication Error Occured!" });
    }
});


module.exports = router;