var mongoose = require("mongoose");
var emergencySchema = new mongoose.Schema({
    Yname: String,
    Sname: String,
    add: String,
    add2: Number,
    Ynumber: Number,
    Snumber: Number,
    problems: String
});

module.exports = mongoose.model("Emergency", emergencySchema);