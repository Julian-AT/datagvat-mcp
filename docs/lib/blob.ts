import { put } from '@vercel/blob';

export async function uploadImage(file: File, conversationId: number): Promise<string> {
  const blob = await put(`conversations/${conversationId}/${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return blob.url;
}

export async function uploadVisualization(
  content: string | Blob,
  filename: string,
  conversationId: number,
  contentType: string
): Promise<string> {
  const blob = await put(`conversations/${conversationId}/${filename}`, content, {
    access: 'public',
    addRandomSuffix: true,
    contentType,
  });

  return blob.url;
}

export async function uploadImageFromBase64(
  base64Data: string,
  filename: string,
  conversationId: number
): Promise<string> {
  // Handle both data URI format and raw base64
  const isDataUri = base64Data.startsWith('data:');
  const byteString = isDataUri ? atob(base64Data.split(',')[1]) : atob(base64Data);
  const mimeString = isDataUri
    ? base64Data.split(',')[0].split(':')[1].split(';')[0]
    : 'image/png'; // default for E2B outputs

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([ab], { type: mimeString });
  const file = new File([blob], filename, { type: mimeString });

  return uploadImage(file, conversationId);
}
