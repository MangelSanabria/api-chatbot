require("dotenv").config();

var ssl = process.env.SSL ? process.env.SSL : "false";
var port = process.env.PORT;

var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  methodOverride = require("method-override"),
  cors = require("cors");

var chatgpt_controller = require("./controllers/chatgpt_controller");

var gpt = express.Router();

app.use(bodyParser.json());
app.use(cors());

/////////////////// ROUTES //////////////////////
gpt.route("/new_query")
  .post(chatgpt_controller.new_query);

app.use("/api", gpt);

// Start server
if (ssl == "true") {
  //HTPPS
  var options = {
    key: fs.readFileSync(process.env.APP_SSL_KEY),
    cert: fs.readFileSync(process.env.APP_SSL_CERT),
    ca: fs.readFileSync(process.env.APP_SSL_CA),
  };
  var server = require("https").createServer(options, app); //https
  server.listen(port, function () {
    console.log("Node server running on https://localhost:" + port);
  });
} else {
  //HTPP
  var server = app.listen(port, async function () {
    console.log(
      "Node server running with workers pool on http://localhost:" + port,
    );
  });
}
