const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");

dotenv.config();

module.exports = async (req, res, next) => {
    let token = req.header("Authorization");

    if (!token)
        return res.status(400).json({ message: "Authentication Header Not Found" });
    token = token.split(" ")[1];

    try {
        let decoded = jwt.verify(
            token,
            process.env.SECRET || "supersecretkeyrembertohide"
        );

        if (!decoded)
            return res.status(400).json({ message: "Expired or Invalid token" });

        const user = await User.find({ email: decoded.email });
        if (!user)
            return res.status(400).json({ message: "Invalid User correspondence" });
        // ATTACH USER TO BODY
        req.body.email = decoded.email;
        // console.log("Authenicated Token - " + decoded.user_id);
        req.body.user_id = decoded.user_id;
        req.body.is_admin = user.is_admin || false;
        
        next();
    } catch (error) {
        return res.status(401).json({ message: "Failed verifying Token", error });
    }
};