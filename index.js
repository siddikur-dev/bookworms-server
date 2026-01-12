const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
// var admin = require("firebase-admin");
const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());

// MongoDB Server Connection
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;

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
    const BookWormsDB = client.db("BookWormsDB");
    const usersCollection = BookWormsDB.collection("users");
    const booksCollection = BookWormsDB.collection("books");
    const libraryCollection = BookWormsDB.collection("library");
    const reviewsCollection = BookWormsDB.collection("reviews");
    const genresCollection = BookWormsDB.collection("genres");
    const tutorialsCollection = BookWormsDB.collection("tutorials");
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // All User API
    // ======================

    //insert user data
    app.post("/users", async (req, res) => {
      const { name, email, photo } = req.body;

      if (!email) {
        return res.status(400).send({ message: "Email is required" });
      }

      const existingUser = await usersCollection.findOne({ email });

      if (existingUser) {
        return res.send({
          message: "User already exists",
          insertedId: null,
        });
      }

      const user = {
        name,
        email,
        photo,
        role: "user", // default
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // get all issues data
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // get single issues data by id
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // update user role by id
    app.patch("/users/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedUserRole = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            name: updatedUserRole.name,
            email: updatedUserRole.email,
            photo: updatedUserRole.photo,
            role: updatedUserRole.role,
          },
        };

        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update issue" });
      }
    });

    // get recent complaints 6 card data
    app.get("/recent-issues", async (req, res) => {
      const query = usersCollection
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
      const result = await usersCollection.findOne(query);
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
        const cursor = usersCollection.find(query);
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

        const result = await usersCollection.updateOne(filter, updateDoc);
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
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // Books Management API
    // ======================
    // POST: /books - Create a new book
    app.post("/books", async (req, res) => {
      const { title, author, genre, description, coverImage, totalPages } =
        req.body;

      const bookData = {
        title,
        author,
        genre,
        description,
        coverImage,
        totalPages,
      };
      const result = await booksCollection.insertOne({
        ...bookData,
        createdAt: new Date(),
        averageRating: 0,
        totalReviews: 0,
      });
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
  res.send("Book Worms Server Running!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
