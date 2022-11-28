import express from "express";

const app = express();
// static 폴더 세팅
app.use("/static", express.static(__dirname + "/static"));

// View Engine PUG 설정
app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/*", (req, res) => {
  res.redirect("/");
});

app.listen(3000, () => console.log("Listen http://localhost:3000"));
