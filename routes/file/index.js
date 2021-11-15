const express = require("express");
const router = express.Router();
const jwtCheck = require("../jwtCheck");
const writeYamlFile = require("write-yaml-file");
const yaml = require('js-yaml');
const fs = require('fs');
const path = require("path");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { check, validationResult } = require("express-validator");


router.post("/createfile", jwtCheck, [
    check('name', 'name is required').not().isEmpty(),
    check('email', 'email is required').isEmail(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email } = req.body;
        console.log(req.user);
        const { id } = req.user;
        await writeYamlFile(`data/${id}/${uuidv4()}.yaml`, { name, email });
        return res.json({
            "title": "success",
            "text": "File Has Been Created"
        });
    } catch (error) {
        console.log(error);
    }
});

router.get("/getfile", jwtCheck, async (req, res) => {
    const { id } = req.user;
    const dir = `data/${id}/`;

    try {
        const readDir = fs.readdirSync(dir);
        const getLastModifiedFile = readDir.filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
            .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
        const doc = yaml.load(fs.readFileSync(`data/${id}/${getLastModifiedFile[0].file}`, 'utf8'));
        doc.location = `/data/${id}/${getLastModifiedFile[0].file}`;
        doc.folderlocation = `/data/${id}/`;
        doc.totalfile = readDir.length;
        doc.allfile = getLastModifiedFile;

        res.json(doc);
    } catch (error) {
        console.log(error);
    }
});

router.get("/getallfile", jwtCheck, async (req, res) => {
    const { id } = req.user;
    const dir = `data/${id}/`;

    try {
        const result = [];
        fs.readdirSync(dir).forEach(val => {
            if (val !== "file.yaml") {
                result.push({
                    fileName: val,
                    location: dir,
                    description: yaml.load(fs.readFileSync(`data/${id}/${val}`, 'utf8'))
                });
            }
        });
        return res.json(result);

    } catch (error) {

    }
});

router.get("/deletefile/:filename", jwtCheck, async (req, res) => {
    const { id } = req.user;
    const { filename } = req.params;
    const dir = `data/${id}/${filename}`;
    fs.unlinkSync(dir);
    res.send(filename);
});

module.exports = router;