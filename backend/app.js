const express = require("express");
const bodyParser = require("body-parser");
const HttpError = require("./models/http-error");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const app = express();

app.use(bodyParser.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

app.use((req, res, next) => {
  // CORS-safelisted request-headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  //browser allows every domain to acsess the api
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, Authorization,X-Requested-With, Content-Type, Accept, Authorization"
  );
  //specifies Headers
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  // res.setHeader('Access-Control-Expose-Headers',' Content-Encoding, Kuma-Revision');
  //specifies the methods allowedcd
  next();
});
app.use("/api/users", usersRoutes);

app.use("/api/places", placesRoutes);

app.use((req, res, next) => {
  const error = new HttpError("could not find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (error) => {
      console.log(error);
    }); // delet the files uploaded in the upload/images directory
  }

  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  const status = error.status || 500;
  res.status(status);
  res.json({ message: error.message || "An unknown error occured" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.v9bbusa.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
