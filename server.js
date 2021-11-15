const express = require("express");
const dotenv = require("dotenv");
const cors = require('cors')
const connectMongo = require("./connection/connectMongo");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({
    extended: false
}));

connectMongo();

app.get("/", (req, res) => {
    res.send("aaaa");
});

// requiring route
app.use("/user", require("./routes/user"));
app.use("/file", require("./routes/file"));
app.use("/country", require("./routes/country"));

app.listen(process.env.PORT, () => {
    console.log(`App listening at http://localhost:${process.env.PORT}`)
});