import { NextResponse } from "next/server";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getDb } from "../../../lib/firebase";

// Simple authentication check for the MVP
const isAuthorized = (request) => {
  const authHeader = request.headers.get("Authorization");

  // For MVP, use a simple hardcoded token
  // In production, use proper authentication methods
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.split(" ")[1];
  return token === "admin123"; // This should be replaced with proper auth in production
};

export async function GET(request) {
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const db = getDb();
    const reportsRef = collection(db, "bugReports");
    const q = query(reportsRef, orderBy("timestamp", "desc"), limit(100));
    const querySnapshot = await getDocs(q);

    const reports = [];
    querySnapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return new NextResponse(
      JSON.stringify({
        reports,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching bug reports:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to fetch bug reports",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
