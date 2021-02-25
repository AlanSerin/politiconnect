const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route  GET api/profile/me
// @desc   Get Current User Profile
// @access Private

// used auth middleware for authentication
router.get('/me', auth, async (req, res) => {
  try {
    // Finding profile by looking for the user field in Profile with the userid in request
    // populating the profile with name and avatar from the User model
    const profile = await Profile.findOne({
      user: req.user.id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  POST api/profile
// @desc   Create or update a user profile
// @access Private

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      location,
      status,
      skills,
      authority,
      rank,
      economic_control,
      economic_aspiration,
      nationalism,
      diplomacy,
      bio,
      youtube,
      facebook,
      twitter,
      instagram,
    } = req.body;

    // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;

    // General user info
    if (location) profileFields.location = location;
    if (status) profileFields.status = status;
    if (bio) profileFields.bio = bio;
    if (skills) {
      // trims space before or after comma
      profileFields.skills = skills.split(',').map((skill) => skill.trim());
    }
    // 6 Axes political values
    if (authority) profileFields.authority = authority;
    if (rank) profileFields.rank = rank;
    if (economic_control) profileFields.economic_control = economic_control;
    if (economic_aspiration)
      profileFields.economic_aspiration = economic_aspiration;
    if (nationalism) profileFields.nationalism = nationalism;
    if (diplomacy) profileFields.diplomacy = diplomacy;

    // Build social object otherwise it doesnt work
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      // Find and check if profile exists
      let profile = await Profile.findOne({ user: req.user.id });

      // if Profile exists, update
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );

        return res.json(profile);
      }

      // create profile if it doesnt exist and save profile
      profile = new Profile(profileFields);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }

    console.log(profileFields.skills);
    res.send('Hello');
  }
);

// @route  GET api/profile
// @desc   Get all profiles
// @access Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  GET api/profile/user/:user_id
// @desc   Get profile by user ID
// @access Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route  DELETE api/profile
// @desc   Delete profile, user, posts
// @access Private
router.delete('/', auth, async (req, res) => {
  try {
    // todo - remove users posts
    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  PUT api/profile/experience
// @desc   Add Profile experience
// @access Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('organization', 'Organization is required').not().isEmpty(),
      check('from', 'From date is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull data from request body
    const {
      title,
      organization,
      location,
      from,
      to,
      current,
      description,
    } = req.body;
    const newExperience = {
      title,
      organization,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExperience);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route  DELETE api/profile/experience/:exp_id
// @desc   Delete Profile experience
// @access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // // Get index for the experience you want to remove
    // const removeindex = profile.experience
    //   .map((item) => item.id)
    //   .indexof(request.params.exp_id);

    // //remove experience from array
    // profile.experience.splice(removeindex, 1);
    profile.experience.remove({ _id: req.params.exp_id });

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route  PUT api/profile/education
// @desc   Add Profile education
// @access Private
router.put(
  '/education',
  [auth, [check('books', 'Book names are required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Pull data from request body
    const { books: books } = req.body;
    const newEducation = {
      books,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEducation);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route  DELETE api/profile/education/:edu_id
// @desc   Delete Profile education
// @access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    // //remove education from array
    profile.education.remove({ _id: req.params.edu_id });

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
