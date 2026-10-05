import "dotenv/config";
import express from "express";
const app = express();
app.use("/", () => {
  console.log("welcome");
});
app.listen(process.env.PORT, () => {
  console.log(`server is running on port ${process.env.PORT}`);
});
