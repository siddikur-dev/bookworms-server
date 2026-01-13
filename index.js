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

    // get all user data
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // get single user data by id
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

    // Books Management API
    // ======================
    // POST: /books - Create a new book

    // post single books data
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

    // get all books data
    app.get("/books", async (req, res) => {
      const result = await booksCollection.find().toArray();
      res.send(result);
    });

    // get single books data by id
    app.get("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.findOne(query);
      res.send(result);
    });

    // update books role by id
    app.patch("/books/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedBooksInfo = req.body;

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            title: updatedBooksInfo.title,
            author: updatedBooksInfo.author,
            genre: updatedBooksInfo.genre,
            description: updatedBooksInfo.description,
            coverImage: updatedBooksInfo.coverImage,
            totalPages: updatedBooksInfo.totalPages,
          },
        };

        const result = await booksCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update issue" });
      }
    });

    // delete books by id
    app.delete("/books/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await booksCollection.deleteOne(query);
      res.send(result);
    });

    // Genre Creation (Admin Only)
    // ======================
    app.post("/genres", async (req, res) => {
      const { name, description } = req.body;
      const newGenre = {
        name,
        description: description || "",
        createdAt: new Date(),
      };
      const result = await genresCollection.insertOne(newGenre);
      res.send(result);
    });

    // get all genres data
    app.get("/genres", async (req, res) => {
      const result = await genresCollection.find().toArray();
      res.send(result);
    });

    // delete my genres
    app.delete("/genres/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await genresCollection.deleteOne(query);
      res.send(result);
    });

    // User Library & Reading Tracker (User Role)
    // ====================================

    // my-library
    app.post("/my-library", async (req, res) => {
      const { bookId, title, author, coverImage, shelf, totalPages } = req.body;
      const email = req.users.email;

      //  Check if the book already exists in the user's library
      const exists = await libraryCollection.findOne({
        userEmail: email,
        bookId: new ObjectId(bookData.bookId),
      });

      if (exists) {
        return res
          .status(400)
          .send({ message: "This book is already in your library!" });
      }

      const bookData = {
        bookId,
        title,
        author,
        coverImage,
        shelf,
        totalPages,
      };

      const newLibraryEntry = {
        ...bookData,
        userEmail: email,
        bookId: new ObjectId(bookData.bookId),
        progressPages: 0,
        addedAt: new Date(),
      };
      const result = await libraryCollection.insertOne(newLibraryEntry);
      res.send(result);
    });

    // get my library data
    app.get("/my-library", async (req, res) => {
      const email = req.user.email;
      const query = { userEmail: email };
      const result = await libraryCollection.find(query).toArray();
      res.send(result);
    });

    // Reviews Management API
    // =========================

    // POST: reviews -submit a new book review)
    app.post("/reviews", async (req, res) => {
      const { bookId, bookTitle, rating, reviewText } = req.body;

      const reviewDoc = {
        bookId: new ObjectId(bookId),
        bookTitle,
        userName: req.user.name,
        userEmail: req.user.email,
        userPhoto: req.user.photo,
        rating: parseFloat(rating),
        reviewText,
        status: "pending", // initial status pending
        createdAt: new Date(),
      };

      const result = await reviewsCollection.insertOne(reviewDoc);

      res.send(result);
    });

    // get all reviews data
    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB"
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
