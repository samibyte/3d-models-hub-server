import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
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

    //read
    app.get("/models", async (req, res) => {
      const result = await modelsColl.find().toArray();
      res.json(result);
    });

    app.get("/latest-models", async (req, res) => {
      const result = await modelsColl
        .find()
        .sort({ created_at: -1 })
        .limit(6)
        .toArray();
      res.json(result);
    });

    //find
    app.get("/models/:id", async (req, res) => {
      const { id } = req.params;
      const result = await modelsColl.findOne({ _id: new ObjectId(id) });
      res.send({ success: true, result });
    });

    //create
    app.post("/models", async (req, res) => {
      const newModel = req.body;
      const result = await modelsColl.insertOne(newModel);
      res.send({ success: true, result });
    });

    // update
    app.put("/models/:id", async (req, res) => {
      const { id } = req.params;
      const updateInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateModel = {
        $set: updateInfo,
      };
      const result = await modelsColl.updateOne(filter, updateModel);

      res.send({ success: true, result });
    });

    // delete
    app.delete("/models/:id", async (req, res) => {
      const { id } = req.params;
      const result = await modelsColl.deleteOne({ _id: new ObjectId(id) });

      res.send({ success: true, result });
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
