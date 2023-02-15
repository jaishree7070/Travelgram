const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../assets/location");
const Place = require("../models/place");
const User = require("../models/user");
const fs = require("fs");

const mongoose = require("mongoose");

const getPlaceByPlaceId = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find the place",
      500
    );
    return next(error);
  }
  if (!place) {
    throw new HttpError("Fetching the place failed try again later", 404);
  }
  res.json({ place: place.toObject({ getters: true }) }); //getters -->it tells mongoose to add the id to the object
};
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError("Fetching places failed try again later", 500);
    return next(error);
  }
  if (!userWithPlaces) {
    return next(new HttpError("Fetching places failed try again later", 404));
  }
  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid Inputs Passed,Please check your data", 422)
    );
  }
  const { title, description, address, creator } = req.body;

  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(
      new HttpError("Address not found", 404)
    );
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator,
  });
  let user;
  //If user doesnt exist ,No polaces can be added
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Creating place failed,Please try again later ",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user of the provided Id", 404);
    return next(error);
  }
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session: session });
    user.places.push(createdPlace);
    //Mongoose establish connections between the two models ,Mongoose adds the created Ids and adds it to the place's field
    await user.save({ session: session });
    await session.commitTransaction();
    //this will only be commited if the sessions are successfull else all the changes will roll back
  } catch (error) {
    const err = new HttpError(
      "Creating place failed ,Please try again later",
      500
    );
    return next(error);
  }
  res.status(201).json({ place: createdPlace }); //created a new
};

const updatePlace = async (req, res, next) => {
  const { title, description } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError(
      "Invalid Inputs Passed,Please check your data",
      422
    );
    return next(error);
  }
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update place",
      500
    );
    return next(error);
  }
  //only allowed to edit by the person who has created it]
//Authorization
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit ", 401);
    return next(error);
  }
  place.title = title;
  place.description = description;
  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update the place",
      500
    );
    return next(error);
  }
  res.status(200).json({ place: place.toObject({ getters: true }) }); //updated and nothing new(200)
};
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator"); //to access documents of different collections
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete the place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("Could not find place for this Id", 404);
    return next(error);
  }
  //Authorization for deletion

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to delete this place ", 401);
    return next(error);
  }

  const imagePath = place.image;
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session: session });
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete the place",
      500
    );
    return next(error);
  }
  fs.unlink(imagePath, (err) => {
    console.log(err); //clean the image when deleting the user
  });
  res.status(200).json({ message: "Deleted the place" });
  //deleted and nothing newadded 200)
};
exports.getPlaceByPlaceId = getPlaceByPlaceId;
exports.getPlacesByUserId = getPlacesByUserId;
exports.deletePlace = deletePlace;
exports.updatePlace = updatePlace;
exports.createPlace = createPlace;
