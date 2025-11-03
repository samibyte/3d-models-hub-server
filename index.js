import express from "express";
import cors from "cors";
const app = express();

const port = process.env.PORT || 5500``;
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello 3d shyt");
});

app.listen(port, () => console.log(`server running on ${port}`));
