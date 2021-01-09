const router = require("express").Router();

const startTime = new Date();
const supported_types = ['number', 'string', 'boolean'];

const Keys = require('../models/Keys');
// const Users = require('../models/Users');
const Specifiers = require('../models/Specifiers');
const Devices = require('../models/Devices');

const verifyToken = require("../middlewares/verifyToken.js");

const ExportJobQueue = {};

// ENDPOINT GET VALUE UNAUTHORIZED
router.get("/:endpoint", async (req, res) => {
    const { endpoint } = req.params;
    Keys.findOne({ endpoint }).then(key => {
        if (key) {
            res.status(200).json({ value: key.value });
        } else {
            return res.status(200).json({
                "message": "Endpoint Not Found",
                "additional_text": "Make sure you send correct endpoint secret."
            })
        }
    })
});

// ENDPOINT RETRIVE AUTHORIZED
router.post("/endpoint", verifyToken, async (req, res) => {
    const { endpoint_secret } = req.body;
    const { user_id } = req.body; // MIDDLEWARE
    const { endpoint_public } = req.body;
    if (endpoint_public) {
        Specifiers.findOne({ endpoint_public }).then(specifier => {
            if (specifier) {
                endpoint = specifier.user_id + '-' + endpoint_secret;
                Keys.findOne({ endpoint }).then(key => {
                    if (key) {
                        res.status(200).json({ value: key.value });
                    } else {
                        return res.status(404).json({
                            "message": "Public Specifier Not Found",
                            "additional_text": "Make sure you send correct public specifier secret."
                        })
                    }
                });
            }
        });
    } else {
        endpoint = user_id + '-' + endpoint_secret;
        Keys.findOne({ endpoint }).then(key => {
            if (key) {
                res.status(200).json({ value: key.value });
            }
        });
    }
    return res.status(404).json({
        "message": "Endpoint Not Found",
        "additional_text": "Make sure you send correct endpoint secret."
    })
});

router.post("/endpoint/create", verifyToken, async (req, res) => {
    // Create new Endpoint - Acts as message room for the communicators
    const { name } = req.body; // KEY NAME For Identification
    const { user_id } = req.body; // MIDDLEWARE
    let description = req.body.description ? req.body.description : user_id + '-' + name; //optional parameter
    let value = req.body.value ? req.body.value : null;
    // console.log(typeof value) 
    let type = req.body.type ? req.body.type : (typeof value);

    if (supported_types.includes(type.toLowerCase())) {
        endpoint_secret = get_random(12).toLowerCase() + '-' + get_random(8).toLowerCase();
        endpoint_public = get_random(10).toLowerCase();
        let endpoint = user_id + '-' + endpoint_secret;
        const newKeyIns = new Keys({ name, type, value, endpoint });
        const newKey = await newKeyIns.save().catch(err => {
            return res.status(500).json({
                "message": "Failed",
                "additional_text": err
            });
        });
        key_id = newKey._id;
        const newSpecifier = new Specifiers({ user_id, key_id, description, endpoint_public })
        await newSpecifier.save().catch(err => {
            return res.status(500).json({
                "message": "Failed",
                "additional_text": err
            });
        });

        return res.status(200).json({
            "message": "Success",
            "endpoint": endpoint,
            "endpoint_public": endpoint_public,
            "key_id": key_id,
            "additional_text": "New Endpoint has been successfully created. Make sure you keep the endpoint details safely."
        });

    } else {
        return res.status(405).json({
            "message": "Method Not Allowed",
            "additional_text": `The provided type - ${type} is not supported yet.`
        });
    }
});

// ENDPOINT CHANGE TYPE - RESETS KEY
router.post("/endpoint/change", verifyToken, async (req, res) => {
    const { endpoint } = req.body;
    const { user_id } = req.body; // MIDDLEWARE
    // let endpoint = user_id + '-' + endpoint_secret;
    const { type } = req.body;
    let value = null;
    if (supported_types.includes(type.toLowerCase())) {
        if (type == "number")
            value = 0;
        else if (type == "string")
            value = '';
        else if (type == "boolean")
            value = false;

        Keys.findOne({ endpoint }).then(async key => {
            if (key) {
                Specifiers.findOne({ user_id: user_id, key_id: key._id }).then(async specifier => {
                    if (specifier) {
                        key.value = value;
                        key.type = type;
                        await key.save().catch(err => {
                            return res.status(500).json({
                                "message": "Failed",
                                "additional_text": err
                            });
                        });

                        return res.status(200).json({
                            "message": "Success",
                            "endpoint": endpoint,
                            "type": type,
                            "additional_text": "New Endpoint has been successfully updated."
                        });
                    } else {
                        return res.status(403).json({
                            "message": "Access not granted",
                            "additional_text": "Make sure you have access to update the values."
                        })
                    }
                });
            } else {
                return res.status(404).json({
                    "message": "Endpoint Not Found",
                    "additional_text": "Make sure you send correct endpoint secret."
                })
            }
        });
    } else {
        return res.status(405).json({
            "message": "Method Not Allowed",
            "additional_text": `The provided type - ${type} is not supported yet.`
        });
    }
});

// ENDPOINT CHANGE VALUE - POST

// Delete Key Endpoint
router.post("/endpoint/remove", verifyToken, async (req, res) => {
    const { endpoint_secret } = req.body;
    const { user_id } = req.body; // MIDDLEWARE
    let endpoint = user_id + '-' + endpoint_secret;
    Keys.findByIdAndDelete({ endpoint }).then(key => {
        if (key) {
            key_id = key._id;
            return res.status(200).json({
                "message": `Key with ID - ${key_id} deleted.`,
                "endpoint": endpoint
            });
        } else {
            return res.status(404).json({
                "message": "Endpoint Not Found",
                "additional_text": "Make sure you send correct endpoint secret."
            })
        }
    }).catch(err => {
        return res.status(500).json({
            "message": "Server Error Occured",
            "additional_text": err
        })
    });
});

router.post("/endpoint/list", verifyToken, async (req, res) => {
    const { is_admin } = req.body;
    const { user_id } = req.body;
    if (is_admin) {
        keys = await Keys.find();
        return res.status(200).json(keys);
    } else {
        keys = [];
        Specifiers.find({ user_id }).then(async specifier => {
            await specifier.forEach(spc => {
                Keys.findOne({ _id: spc.key_id }).then(key => {
                    if (key) {
                        keys.push(key);
                        console.log(key);
                    }

                });
            });

            if (keys.length == 0) {
                return res.status(404).json({
                    "message": "Keys Not Found",
                    "additional_text": "No keys are created for the current user account."
                })
            } else {
                return res.status(200).json(keys);
            }
        });
    }

});

router.post('/endpoint/retrive', verifyToken, async (req, res) => {
    const { user_id } = req.body;
    const { endpoint_public } = req.body;

    Specifiers.findOne({ user_id, endpoint_public }).then(specifier => {
        if (specifier) {
            Keys.findOne({ _id: specifier.key_id}).then(key => {
                if(key) {
                    return res.status(200).json({
                        "message": "Success",
                        "endpoint": key.endpoint,
                        "name": key.name
                    })
                } else {
                    return res.status(404).json({
                        "message": "Endpoint Not Found",
                        "additional_text": "Make sure you send correct endpoint public."
                    })
                }
            });
        } else {
            return res.status(400).json({
                "message": "Access Specifier Invalid",
                "additional_text": "Make sure you send correct endpoint public key."
            })
        }
    }).catch(err => {
        return res.status(500).json({
            "message": "Server Error Occured",
            "additional_text": err
        })
    });

});


function get_random(n) {
    let random_string = "";
    const charset = "0A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9";
    for (let i = 0; i < n; i++)
        random_string += charset.charAt(Math.floor(Math.random() * charset.length));
    return random_string;
}

module.exports = router;
