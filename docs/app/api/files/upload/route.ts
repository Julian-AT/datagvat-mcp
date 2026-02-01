import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";

// Validation schema for uploaded files
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size must be less than 5MB",
    })
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/svg+xml", "text/html"].includes(file.type),
      {
        message: "File type must be JPEG, PNG, SVG, or HTML",
      }
    ),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    // Validate file
    const validatedFile = FileSchema.safeParse({ file });
    if (!validatedFile.success) {
      return NextResponse.json(
        { error: validatedFile.error.errors[0].message },
        { status: 400 }
      );
    }

    // Get filename from FormData
    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    // Upload to Vercel Blob with public access
    const blob = await put(filename, fileBuffer, {
      access: "public",
      addRandomSuffix: true, // Prevent filename collisions
    });

    // Return blob metadata
    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
