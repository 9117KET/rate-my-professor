import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    // Get the client's IP from the request headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0]
      : request.headers.get("x-real-ip");

    // If we can't get the IP, generate a random one for development
    const fallbackIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(
      Math.random() * 255
    )}`;

    return NextResponse.json({
      ip: ip || fallbackIp,
      source: ip ? "real" : "fallback",
    });
  } catch (error) {
    console.error("Error getting IP:", error);
    return NextResponse.json(
      {
        error: "Failed to get IP address",
        ip: null,
      },
      {
        status: 500,
      }
    );
  }
}
