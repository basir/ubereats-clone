const { onInit, setGlobalOptions } = require("firebase-functions");
const { onRequest, onCall, HttpsError } = require("firebase-functions/https");
const { onDocumentCreated } = require("firebase-functions/firestore");
const { defineString } = require('firebase-functions/params');
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const STRIPE_SECRET_KEY = defineString('STRIPE_SECRET_KEY');
const Stripe = require('stripe');

let stripe;

admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

onInit(() => {
    stripe = new Stripe(STRIPE_SECRET_KEY.value());
});


exports.createPaymentIntent = onCall(async (request) => {
    const { amount, currency = "usd" } = request.data;
    if (!amount || amount <= 0) {
        throw new HttpsError("invalid-argument", "The function must be called with a positive amount.");
    }
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return {
            clientSecret: paymentIntent.client_secret,
        };
    } catch (error) {
        logger.error("Error creating payment intent:", error);
        throw new HttpsError("internal", error.message);
    }
});

// Recalculate restaurant avgRating and ratingCount when a review is created
exports.onReviewCreated = onDocumentCreated("reviews/{reviewId}", async (event) => {
    const review = event.data?.data();
    if (!review?.restaurantId) return;

    const db = admin.firestore();
    const restaurantRef = db.collection("restaurants").doc(review.restaurantId);

    try {
        await db.runTransaction(async (tx) => {
            const reviewsSnap = await tx.get(
                db.collection("reviews").where("restaurantId", "==", review.restaurantId)
            );
            const count = reviewsSnap.size;
            const totalRating = reviewsSnap.docs.reduce((sum, d) => sum + (d.data().rating || 0), 0);
            const avgRating = count > 0 ? Math.round((totalRating / count) * 10) / 10 : 0;

            tx.update(restaurantRef, { rating: avgRating, ratingCount: count });
        });
        logger.info(`Updated restaurant ${review.restaurantId}: rating recalculated`);
    } catch (e) {
        logger.error("Failed to update restaurant rating", e);
    }
});
