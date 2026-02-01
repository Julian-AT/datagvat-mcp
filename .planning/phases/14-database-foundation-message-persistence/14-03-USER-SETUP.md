# User Setup: Vercel Blob Storage

Plan 14-03 added Vercel Blob integration for image uploads. Manual configuration required.

## Environment Variables

Add to `docs/.env.local`:

```bash
# Vercel Blob storage token
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxx"
```

## Setup Steps

### 1. Create Vercel Blob Store

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** → **Create Database** → **Blob**
3. Name: `datagvat-mcp-files` (or any name)
4. Click **Create**

### 2. Get Access Token

1. In the Blob store page, click **Settings** tab
2. Copy the **Read-Write Token**
3. Add to `docs/.env.local` as `BLOB_READ_WRITE_TOKEN`

### 3. Verify Configuration

```bash
cd docs

# Check token is set
grep BLOB_READ_WRITE_TOKEN .env.local

# Start dev server (should not error on blob imports)
bun dev
```

## Usage Pattern

The `lib/blob.ts` utilities upload files to:
- Path: `conversations/{conversationId}/{filename}`
- Access: Public (no pre-signed URLs needed)
- Immutable: Random suffix prevents cache conflicts

Example:
```typescript
import { uploadImage } from '@/lib/blob';

const file = new File([blob], 'screenshot.png', { type: 'image/png' });
const url = await uploadImage(file, conversationId);
// Returns: https://xxxxxx.public.blob.vercel-storage.com/conversations/123/screenshot-abc123.png
```

## Cost Considerations

**Vercel Blob Free Tier:**
- Storage: 1 GB
- Bandwidth: 100 GB/month
- Requests: 1M reads/month

For v2.2 development this is more than sufficient. Production usage may require paid plan.

## Troubleshooting

**Error: "BLOB_READ_WRITE_TOKEN is not set"**
- Check `.env.local` has the token
- Restart dev server after adding env var

**Error: "Unauthorized" when uploading**
- Verify token is Read-Write (not Read-Only)
- Check token hasn't expired

**Upload succeeds but URL 404s**
- Check access is set to "public" (default in uploadImage)
- Verify Blob store is active in Vercel dashboard
