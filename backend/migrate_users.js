import mongoose from 'mongoose';
import config from './config/index.js';

const migrate = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');
    
    const usersCollection = mongoose.connection.db.collection('users');
    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} total users in DB.`);
    
    let migratedCount = 0;
    
    for (const user of users) {
      const updates = {};
      let needsUpdate = false;
      
      // Migrate fullName -> name
      if (user.fullName && !user.name) {
        updates.name = user.fullName;
        needsUpdate = true;
      }
      
      // Migrate passwordHash -> password
      if (user.passwordHash && !user.password) {
        updates.password = user.passwordHash;
        needsUpdate = true;
      }
      
      // Migrate phoneNumber -> phone
      if (user.phoneNumber && !user.phone) {
        updates.phone = user.phoneNumber;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: updates }
        );
        console.log(`Migrated user: ${user.email} (ID: ${user._id})`);
        migratedCount++;
      }
    }
    
    console.log(`Migration completed. ${migratedCount} users updated.`);
  } catch (err) {
    console.error('Migration failed with error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

migrate();
