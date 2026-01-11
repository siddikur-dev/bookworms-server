const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
// var admin = require("firebase-admin");
const port = process.env.PORT || 3000;
// middleware
app.use(cors());
app.use(express.json());


// MongoDB Server Connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.rfkbq1n.mongodb.net/?appName=Cluster0`;

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
    const issuesCollection = client.db("issuesDB").collection("all-issues");
    const contributionCollection = client
      .db("issuesDB")
      .collection("all-contributions");
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    //insert issue data
    app.post("/all-issues", async (req, res) => {
      const issue = req.body;
      const result = await issuesCollection.insertOne(issue);
      res.send(result);
    });

    // get all issues data
    app.get("/all-issues", async (req, res) => {
      const result = await issuesCollection.find().toArray();
      res.send(result);
    });

    // get single issues data by id
    app.get("/all-issues/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.findOne(query);
      res.send(result);
    });

    // get recent complaints 6 card data
    app.get("/recent-issues", async (req, res) => {
      const query = issuesCollection
        .find()
        .sort({ date: "descending" })
        .limit(6);
      const result = await query.toArray();
      res.send(result);
    });

    // get single card recent complaints
    app.get("/issues/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.findOne(query);
      res.send(result);
    });

    // get my added issues
    app.get("/my-issues", async (req, res) => {
      try {
        const query = {};
        const email = req.query.email;
        if (email) {
          query.email = email; // email ফিল্ড যদি DB তে reporterEmail নামে থাকে
        }
        const cursor = issuesCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to fetch issues" });
      }
    });

    // update/put added my issues
    app.put("/my-issues/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedIssue = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            title: updatedIssue.title,
            category: updatedIssue.category,
            amount: updatedIssue.amount,
            description: updatedIssue.description,
            status: updatedIssue.status,
          },
        };

        const result = await issuesCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update issue" });
      }
    });

    // delete my added issues
    app.delete("/my-issues/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.deleteOne(query);
      res.send(result);
    });

    

    // Send a ping to confirm a successful connection
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
  res.send("Clean Bangla Server Running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
