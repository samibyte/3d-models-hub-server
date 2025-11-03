import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion } from "mongodb";
const app = express();

const port = process.env.PORT || 5500``;
app.use(cors());
app.use(express.json());

const uri = process.env.DB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("3dModelDb");
    const modelsColl = db.collection("3d-models");

    app.get("/models", async (req, res) => {
      const result = await modelsColl.find().toArray();
      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello 3d shyt");
});

app.listen(port, () => console.log(`server running on ${port}`));
