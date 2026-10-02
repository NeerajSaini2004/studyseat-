import Library from '../models/Library.js';

export const createLibrary = async (req, res, next) => {
  try {
    const { 
      name, 
      address, 
      city, 
      totalSeats, 
      fees, 
      monthlyFee,
      openingTime, 
      closingTime, 
      facilities, 
      images, 
      location 
    } = req.body;
    
    const generatedSeats = [];
    if (totalSeats && totalSeats > 0) {
      const seatsPerRow = 10;
      for (let i = 0; i < totalSeats; i++) {
        const rowChar = String.fromCharCode(65 + Math.floor(i / seatsPerRow));
        const seatNum = (i % seatsPerRow) + 1;
        generatedSeats.push({
          seatNumber: `${rowChar}${seatNum}`,
          status: 'available',
          seatType: 'standard'
        });
      }
    }

    const library = await Library.create({
      ownerId: req.user.id,
      name,
      address,
      city,
      totalSeats,
      occupiedSeats: 0,
      fees,
      monthlyFee,
      openingTime,
      closingTime,
      facilities: facilities || [],
      images: images || [],
      location: location || { type: 'Point', coordinates: [0, 0] },
      seats: generatedSeats
    });

    res.status(201).json({
      status: 'success',
      data: { library }
    });
  } catch (error) {
    next(error);
  }
};

export const getLibrary = async (req, res, next) => {
  try {
    const library = await Library.findById(req.params.id);
    if (!library) {
      return res.status(404).json({
        status: 'error',
        message: 'Library not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: { library }
    });
  } catch (error) {
    next(error);
  }
};

export const getSeats = async (req, res, next) => {
  try {
    const library = await Library.findById(req.params.id).select('seats');
    if (!library) {
      return res.status(404).json({
        status: 'error',
        message: 'Library not found'
      });
    }
    res.status(200).json({
      status: 'success',
      data: { seats: library.seats }
    });
  } catch (error) {
    next(error);
  }
};

export const listLibraries = async (req, res, next) => {
  try {
    const { lat, lng, radius, facilities, maxRate, city, ownerId, page = 1, limit = 10 } = req.query;
    const query = {};

    // Filter by owner if provided
    if (ownerId) {
      query.ownerId = ownerId;
    }

    // 1. Geospatial search
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius) || 5000 // default to 5km radius
        }
      };
    }

    // 2. City filter
    if (city) {
      query.city = { $regex: new RegExp(city, 'i') };
    }

    // 3. Facilities filter (all listed tags must match)
    if (facilities) {
      const facilityList = facilities.split(',').map(f => f.trim());
      query.facilities = { $all: facilityList };
    }

    // 4. Price rate filter (fees)
    if (maxRate) {
      query.fees = { $lte: parseFloat(maxRate) };
    }

    // 5. Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const libraries = await Library.find(query)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      status: 'success',
      results: libraries.length,
      page: parseInt(page),
      data: { libraries }
    });
  } catch (error) {
    next(error);
  }
};

// Owner edits their library details
export const updateLibrary = async (req, res, next) => {
  try {
    const library = await Library.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!library) {
      return res.status(404).json({ status: 'error', message: 'Library not found or not owned by you.' });
    }

    const allowedFields = ['name', 'address', 'city', 'fees', 'monthlyFee', 'openingTime', 'closingTime', 'facilities'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        library[field] = req.body[field];
      }
    });

    await library.save();

    res.status(200).json({
      status: 'success',
      message: 'Library updated successfully',
      data: { library }
    });
  } catch (error) {
    next(error);
  }
};

// Owner updates a single seat's status (available / maintenance)
export const updateSeat = async (req, res, next) => {
  try {
    const library = await Library.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!library) {
      return res.status(404).json({ status: 'error', message: 'Library not found or not owned by you.' });
    }

    const seatIndex = library.seats.findIndex(s => s._id.toString() === req.params.seatId);
    if (seatIndex === -1) {
      return res.status(404).json({ status: 'error', message: 'Seat not found.' });
    }

    const { status } = req.body;
    const allowed = ['available', 'maintenance'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ status: 'error', message: `Invalid seat status. Allowed values: ${allowed.join(', ')}` });
    }

    library.seats[seatIndex].status = status;
    await library.save();

    res.status(200).json({
      status: 'success',
      message: `Seat ${library.seats[seatIndex].seatNumber} updated to '${status}'`,
      data: { seat: library.seats[seatIndex] }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadPhotos = async (req, res, next) => {
  try {
    const library = await Library.findOne({ _id: req.params.id, ownerId: req.user.id });
    if (!library) {
      return res.status(404).json({ status: 'error', message: 'Library not found or not owned by you.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Please upload at least 1 photo.' });
    }

    if (req.files.length > 5) {
      return res.status(400).json({ status: 'error', message: 'Maximum 5 photos allowed.' });
    }

    // Convert file paths to URLs (using local server path)
    const photoUrls = req.files.map(file => `/uploads/${file.filename}`);

    // Update library images (overwrite existing for MVP simplicity, or append if you prefer, but requirement is 3 to 5 total)
    library.images = photoUrls;
    await library.save();

    res.status(200).json({
      status: 'success',
      message: 'Photos uploaded successfully',
      data: { images: library.images }
    });
  } catch (error) {
    next(error);
  }
};
