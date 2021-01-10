const router = require("express").Router();
const basicAuth = require('express-basic-auth');

const startTime = new Date();

const Keys = require('../models/Keys');
const Users = require('../models/Users');
// const Specifiers = require('../models/Specifiers');
const Devices = require('../models/Devices');

require('dotenv').config();

const verifyToken = require("../middlewares/verifyToken.js");

router.post('/create', verifyToken, async (req, res) => {
    const { user_id, is_admin } = req.body;
    const { device_id, name, description, type } = req.body;
    if (!device_id)
        return res.status(400).json({
            "message": "No Content",
            "additional_text": "No device ID was found."
        });
    // console.log({ device_id, name, description });
    Devices.findOne({ device_id }).then(async dev => {
        if (dev) {
            res.status(409).json({
                "message": "Already Exists",
                "additional_text": "Device already exists, please delete before continuing to add."
            });
        } else {
            is_active = false;
            const device = new Devices({ device_id, name, description, type, is_active });
            const created = await device.save().catch(err => {
                return res.status(500).json({
                    "message": "Failed",
                    "additional_text": err
                });
            });
            if (created) {
                return res.status(200).json({
                    "message": "Success",
                    "device_id": device_id,
                    "additional_text": "New Device has be created successfully."
                });
            } else {
                return res.status(500).json({
                    "message": "Failed",
                    "additional_text": "Some error occured, please try again."
                });
            }
        }
    })
    // Auto Generate Endpoint TO DO
});

// Delete Device
router.post('/delete', verifyToken, async (req, res) => {
    const { user_id, is_admin } = req.body;
    const { device_id } = req.body;

    if (is_admin) {
        Devices.findOneAndDelete({ device_id }).then(device => {
            if (device) {
                return res.status(200).json({
                    "message": "Success",
                    "additional_text": `Device with ID - ${device_id} has been deleted.`
                })
            } else {
                return res.status(404).json({
                    "message": "Device Not Found",
                    "additional_text": "Make sure you send correct device ID."
                });
            }
        });
    } else {
        Devices.findOneAndDelete({ device_id, user_id }).then(async device => {
            if (device) {
                return res.status(200).json({
                    "message": "Success",
                    "additional_text": `Device with ID - ${device_id} has been deleted.`
                });
            } else {
                return res.status(403).json({
                    "message": "Unauthorized",
                    "additional_text": "Make sure you have access to the device."
                });
            }
        }).catch(err => {
            return res.status(500).json({
                "message": "Some Error Occured",
                "additional_text": "Make sure you have sent correct device ID and have access to the device."
            });
        });
    }

});

// Device Generate Endpoint
router.post('/generate-endpoint', verifyToken, async (req, res) => {
    const { user_id } = req.body;
    const { device_id } = req.body;

    Devices.findOneAndDelete({ device_id, user_id }).then(async device => {
        if(device) {
            // PRIMARILY CALL /api/endpoint/create and /device/set-endpoint
        } else {
            return res.status(403).json({
                "message": "Unauthorized",
                "additional_text": "Make sure you have access to the device."
            });
        }
    });
});

// Create and Change Endpoint
router.post('/set-endpoint', verifyToken, async (req, res) => {
    const { user_id } = req.body;
    const { device_id, endpoint } = req.body;
    Devices.findOne({ device_id }).then(async device => {
        if (device) {
            if (device.user_id) {
                if (device.user_id == user_id) {
                    device.endpoint = endpoint;
                    device.is_active = true;
                    await device.save().catch(err => {
                        return res.status(500).json({
                            "message": "Failed",
                            "additional_text": err
                        });
                    });

                    return res.status(200).json({
                        "message": "Success",
                        "additional_test": `Endpoint for device with ${device_id} updated.`
                    })
                } else {
                    return res.status(403).json({
                        "message": "Access not granted",
                        "additional_text": "Make sure you have access to update the device."
                    })
                }
            } else {
                device.endpoint = endpoint;
                device.is_active = true;
                device.user_id = user_id;
                await device.save().catch(err => {
                    return res.status(500).json({
                        "message": "Failed",
                        "additional_text": err
                    });
                });

                return res.status(200).json({
                    "message": "Success",
                    "additional_test": `Endpoint for Device - ${device_id} created.`
                })
            }
        } else {
            return res.status(404).json({
                "message": "Device Not Found",
                "additional_text": "Make sure you send correct device ID."
            });
        }
    });
});

// Reset the Device
router.post('/reset', verifyToken, async (req, res) => {
    const { user_id } = req.body;
    const { is_admin } = req.body;
    const { device_id } = req.body;

    if (is_admin) {
        Devices.findOne({ device_id }).then(async device => {
            if (device) {
                device.endpoint = null;
                device.is_active = false;
                device.user_id = null;
                await device.save().catch(err => {
                    return res.status(500).json({
                        "message": "Failed",
                        "additional_text": err
                    });
                });

                return res.status(200).json({
                    "message": "Success",
                    "additional_text": `Device with ID - ${device_id} has been reset successfully.`
                })
            } else {
                return res.status(404).json({
                    "message": "Device Not Found",
                    "additional_text": "Make sure you send correct device ID."
                });
            }
        });
    } else {
        Devices.findOne({ device_id, user_id }).then(async device => {
            if (device) {
                device.endpoint = null;
                device.is_active = false;
                device.user_id = null;
                await device.save().catch(err => {
                    return res.status(500).json({
                        "message": "Failed",
                        "additional_text": err
                    });
                });

                return res.status(200).json({
                    "message": "Success",
                    "additional_text": `Device with ID - ${device_id} has been reset successfully.`
                })
            } else {
                return res.status(403).json({
                    "message": "Access not granted",
                    "additional_text": "Make sure you have access to update the values."
                })
            }
        });
    }

});

router.post('/list', verifyToken, async (req, res) => {
    const { user_id } = req.body;
    const { is_admin } = req.body;

    if (is_admin) {
        devices = await Devices.find();
        return res.status(200).json({ devices });
    } else {
        devices = await Devices.find({ user_id });
        return res.status(200).json({ devices });
    }
});

b_username = process.env.SALT;
b_password = process.env.SECRET;
const basic = basicAuth({
    users: { b_username: b_password }
});

router.post('/fetch', basic, async (req, res) => {
    const { device_id } = req.body;
    Devices.findOne({ device_id }).then(device => {
        if (device) {
            if (device.is_active)
                return res.status(200).json({
                    "endpoint": device.endpoint
                });
            else
                return res.status(200).json({
                    "endpoint": null
                });
        } else {
            // TO CREATE NULL DEVICE

            return res.status(404).json({
                "message": "Device Not Found",
                "additional_text": "Make sure you send correct device ID."
            })
        }
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
