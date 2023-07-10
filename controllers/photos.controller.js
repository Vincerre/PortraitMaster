const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    const pattern = new RegExp(/(([A-z]|[0-9]|\.)*)/, 'g');
    const emailPattern = new RegExp(
      /(([A-z]|[0-9]|\.)*)@(([A-z]|[0-9]|\.)*).(([A-z])*)/,
      'g'
    );

    const titleMatched = title.match(pattern).join('');
    const authorMatched = author.match(pattern).join('');
    const emailMatched = email.match(emailPattern).join('');

    if (
      titleMatched &&
      authorMatched &&
      emailMatched &&
      file &&
      title.length <= 25 &&
      author.length <= 50
    ) {
      // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];
      if (
        fileExt === 'jpg' ||
        fileExt === 'jpeg' ||
        fileExt === 'psd' ||
        fileExt === 'gif' ||
        fileExt === 'png'
      ) {
        const newPhoto = new Photo({
          title,
          author,
          email,
          src: fileName,
          votes: 0,
        });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });

    const userIp = requestIp.getClientIp(req);
    const user = await Voter.findOne({ user: userIp });

    if (user) {
      if (user.votes.includes(photoToUpdate._id)) {
        res
          .status(500)
          .json({ message: 'You have already voted on this photo' });
      } else {
        user.votes.push(photoToUpdate._id);
        await user.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      }
    } else {
      const newVoter = new Voter({ user: userIp, votes: photoToUpdate._id });
      await newVoter.save();
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: 'OK' });
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
