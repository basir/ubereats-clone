import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = getFirestore();

function loadJson(filename) {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'db', filename), 'utf8'));
}

async function seedCollection(collectionName, items) {
    console.log(`Seeding ${items.length} ${collectionName}...`);
    for (const item of items) {
        await db.collection(collectionName).doc(item.id.toString()).set(item);
    }
}

async function seedDatabase() {
    console.log('Starting seed...');

    // Delete all existing Firebase Auth users
    console.log('Deleting all existing Firebase Auth users...');
    try {
        const listUsersResult = await admin.auth().listUsers();
        const deletePromises = listUsersResult.users.map(u => admin.auth().deleteUser(u.uid));
        await Promise.all(deletePromises);
        console.log(`Deleted ${listUsersResult.users.length} Firebase Auth users`);
    } catch (error) {
        console.error('Error deleting Firebase Auth users:', error);
    }

    // Seed Users (creates Firebase Auth + Firestore doc)
    const users = loadJson('users.json');
    console.log(`Seeding ${users.length} users...`);
    for (const user of users) {
        try {
            const firebaseUser = await admin.auth().createUser({
                email: user.email,
                password: user.password,
                displayName: user.name,
            });
            console.log(`Created Auth user: ${user.email} (${firebaseUser.uid})`);
            const { password, ...userData } = user;
            await db.collection('users').doc(user.id.toString()).set({
                ...userData,
                firebaseUserId: firebaseUser.uid,
            });
        } catch (error) {
            console.error(`Error creating user ${user.email}:`, error);
        }
    }

    await seedCollection('restaurants', loadJson('restaurants.json'));
    await seedCollection('menuItems', loadJson('menuItems.json'));
    await seedCollection('cuisineCategories', loadJson('cuisineCategories.json'));
    await seedCollection('carts', loadJson('carts.json'));
    await seedCollection('orders', loadJson('orders.json'));
    await seedCollection('wishlist', loadJson('wishlist.json'));
    await seedCollection('reviews', loadJson('reviews.json'));
    await seedCollection('banners', loadJson('banners.json'));

    console.log('Seed complete!');
}

seedDatabase().catch(console.error);
