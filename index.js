import express from "express";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import admin from "firebase-admin";
import fs from "fs";
const app = express();
const port = process.env.PORT || 5500;

//middleware
app.use(cors());
app.use(express.json());

let serviceAccount;
if (process.env.FIREBASE_ADMIN_KEY) {
  serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
} else {
  serviceAccount = JSON.parse(
    fs.readFileSync("./firebaseAdminKey.json", "utf8")
  );
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const verifyFBToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "unauthorized access. Token not found",
    });
  }
  const token = authorization.split(" ")[1];

  try {
    await admin.auth().verifyIdToken(token);

    next();
  } catch (err) {
    res.status(401).send({
      message: "unauthorized access. Token not found",
    });
  }
};

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
    // await client.connect();

    const db = client.db("3dModelDb");
    const modelsColl = db.collection("3d-models");
    const downloadsColl = db.collection("downloads");

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

    app.get("/search", async (req, res) => {
      const searchText = req.query.searchText;
      const result = await modelsColl
        .find({
          name: {
            $regex: searchText,
            $options: "i",
          },
        })
        .toArray();
      res.json(result);
    });

    //find
    app.get("/model-details/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      const result = await modelsColl.findOne({ _id: new ObjectId(id) });
      res.send({ success: true, result });
    });

    app.get("/my-model", verifyFBToken, async (req, res) => {
      const email = req.query.email;
      const query = { created_by: email };
      const result = await modelsColl.find(query).toArray();
      res.send(result);
    });

    //create
    app.post("/models", verifyFBToken, async (req, res) => {
      const newModel = req.body;
      const result = await modelsColl.insertOne(newModel);
      res.send({ success: true, result });
    });

    // update
    app.put("/models/:id", verifyFBToken, async (req, res) => {
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
    app.delete("/models/:id", verifyFBToken, async (req, res) => {
      const { id } = req.params;
      const result = await modelsColl.deleteOne({ _id: new ObjectId(id) });

      res.send({ success: true, result });
    });

    // download related api
    app.get("/downloads", verifyFBToken, async (req, res) => {
      const email = req.query.email;
      const result = await downloadsColl
        .find({ downloaded_by: email })
        .toArray();
      res.json(result);
    });

    app.post("/downloads", verifyFBToken, async (req, res) => {
      const model = req.body;
      const result = await downloadsColl.insertOne(model);

      const filter = { _id: new ObjectId(model._id) };
      const updateDoc = {
        $inc: {
          downloads: 1,
        },
      };

      const downloadCounted = modelsColl.updateOne(filter, updateDoc);

      res.send(result, downloadCounted);
    });

    // await client.db("admin").command({ ping: 1 });
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
