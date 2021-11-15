const express = require("express");
const router = express.Router();

// additional lib
const { v4: uuidv4 } = require("uuid");
const { check, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const writeYamlFile = require("write-yaml-file");
const axios = require("axios");

// require model 
const User = require("../../model/User");
const jwtCheck = require("../jwtCheck");

router.post("/register", [
    check('name', 'name is required').not().isEmpty(),
    check('email', 'email is required').isEmail(),
    check('country', 'country is required').not().isEmpty(),
    check('passwordText', 'password is required').not().isEmpty()
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { name, email, country, passwordText } = req.body;
            const salt = await bcryptjs.genSalt(10);
            let password = await bcryptjs.hash(passwordText, salt);

            let user = await User.findOne({ name });
            if (!user) {

                user = new User({
                    id: uuidv4(),
                    name,
                    email,
                    country,
                    passwordText,
                    password
                });

                await user.save();
                await writeYamlFile(`data/${user.id}/file.yaml`, { name, email });

                return res.json({
                    "title": "success",
                    "text": "User Has Been Created"
                });
            }

            return res.json({
                "title": "failed",
                "text": "User Already Exits"
            });
        } catch (error) {
            return res.json({
                "title": "failed",
                "text": "Server Error"
            });
        }
    });

router.post("/login", [
    check('name', 'name is required').not().isEmpty(),
    check('passwordText', 'password is required').not().isEmpty()
],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const { name, passwordText } = req.body;
            const user = await User.findOne({ name });

            if (user) {
                const isMatch = await bcryptjs.compare(passwordText, user.password);
                if (isMatch) {
                    const payload = {
                        id: user.id,
                        name
                    };
                    const token = jwt.sign(payload, process.env.ACCESS_TOKEN);
                    return res.json({
                        "title": "success",
                        "text": "Login success",
                        token
                    });
                }
                return res.json({
                    "title": "failed",
                    "text": "Wrong Name or Password"
                });
            }
            return res.json({
                "title": "failed",
                "text": "Wrong Name or Password"
            });
        } catch (error) {
            console.log(error);
            return res.json({
                "title": "failed",
                "text": "Server Error"
            });
        }
    });

router.get("/getmydata", jwtCheck, async (req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findOne({ id }).select("-_id -__v -passwordText -password");
        const resp = await axios.get(`https://restcountries.com/v3.1/name/${user.country}?fullText=true`);
        const userfix = user;
        return res.json({
            user: userfix,
            coutryflags: resp.data[0].flags.png
        });
    } catch (error) {
        console.log(error);
    }
});

module.exports = router;