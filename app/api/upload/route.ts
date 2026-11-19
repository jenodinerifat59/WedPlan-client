import { NextResponse } from "next/server";

import { getAuth } from "@/lib/auth";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const apiKey = process.env.IMGBB_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Image uploads are not configured on this deployment. Add an image URL instead, or ask an administrator to set IMGBB_API_KEY.",
      },
      { status: 503 },
    );
  }

  try {
    const session = await getAuth().api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Sign in to upload service photos." },
        { status: 401 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Authentication is temporarily unavailable. Try again shortly." },
      { status: 503 },
    );
  }

  let file: File | null = null;

  try {
    const form = await request.formData();
    const candidate = form.get("image");
    file = candidate instanceof File ? candidate : null;
  } catch {
    return NextResponse.json(
      { error: "The upload could not be read. Please try again." },
      { status: 400 },
    );
  }

  if (!file) {
    return NextResponse.json(
      { error: "Choose an image file to upload." },
      { status: 400 },
    );
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files can be uploaded." },
      { status: 415 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Images must be 5 MB or smaller." },
      { status: 413 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const body = new FormData();
    body.append("image", buffer.toString("base64"));

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`,
      { method: "POST", body },
    );

    const payload = (await response.json()) as {
      success?: boolean;
      data?: { display_url?: string; url?: string };
      error?: { message?: string };
    };

    const url = payload.data?.display_url ?? payload.data?.url;

    if (!response.ok || !payload.success || !url) {
      return NextResponse.json(
        {
          error:
            payload.error?.message ??
            "The image host rejected this upload. Try a smaller JPG or PNG.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: "We could not reach the image host. Please try again." },
      { status: 502 },
    );
  }
}
