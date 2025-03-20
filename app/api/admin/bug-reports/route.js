import { NextResponse } from "next/server";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getApp, initializeApp, getApps } from "firebase/app";

// Initialize Firebase if not already initialized
const getFirebaseApp = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  // Make sure we have the required environment variables
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId =
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  // Check if any required values are missing
  if (!apiKey || !projectId) {
    throw new Error(
      "Missing required Firebase configuration environment variables"
    );
  }

  const firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    measurementId,
  };

  return initializeApp(firebaseConfig);
};

// Simple admin auth check - in a real app, you would use proper authentication
const isAdmin = async (request) => {
  const authHeader = request.headers.get("Authorization");

  // In production, you would verify this token against your auth system
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.substring(7);
  // Check against admin tokens in your secure storage
  // For demo purposes, this is a simple check
  const adminSecret = process.env.ADMIN_API_SECRET;
  return token === adminSecret;
};

export async function GET(request) {
  try {
    // Check admin authentication
    const adminCheck = await isAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const maxResults = parseInt(
      request.nextUrl.searchParams.get("limit") || "100"
    );

    // Get bug reports from Firestore
    const app = getFirebaseApp();
    const db = getFirestore(app);

    const reportsQuery = query(
      collection(db, "bug_reports"),
      orderBy("timestamp", "desc"),
      limit(maxResults)
    );

    const snapshot = await getDocs(reportsQuery);
    const reports = [];

    snapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toISOString() || null,
      });
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching bug reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch bug reports" },
      { status: 500 }
    );
  }
}
