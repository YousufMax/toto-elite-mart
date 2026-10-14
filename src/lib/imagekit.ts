import ImageKit from 'imagekit';

let imagekitClient: ImageKit | null = null;

export function getImageKitClient(): ImageKit | null {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (
    !publicKey ||
    publicKey.startsWith('mock_') ||
    !privateKey ||
    privateKey.startsWith('mock_') ||
    !urlEndpoint ||
    urlEndpoint.includes('/demo')
  ) {
    return null;
  }

  if (!imagekitClient) {
    imagekitClient = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }

  return imagekitClient;
}

export function isImageKitConfigured(): boolean {
  return getImageKitClient() !== null;
}

/**
 * Generate short-lived client-side upload authentication parameters.
 * Private key is never sent to the browser!
 */
export function getUploadAuthParams() {
  const client = getImageKitClient();
  if (!client) {
    // Return mock signature parameters for local preview / developer testing
    const expire = Math.floor(Date.now() / 1000) + 1800;
    return {
      token: 'mock_token_' + Date.now(),
      expire,
      signature: 'mock_signature_dev',
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'mock_public_key',
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/demo',
      isConfigured: false,
    };
  }

  const authParams = client.getAuthenticationParameters();
  return {
    ...authParams,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
    isConfigured: true,
  };
}

/**
 * Safely delete an image from ImageKit CDN when a product image is removed
 */
export async function deleteRemoteImage(fileId: string): Promise<boolean> {
  const client = getImageKitClient();
  if (!client || !fileId || fileId.startsWith('mock_')) return true;

  try {
    await client.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error('[IMAGEKIT_DELETE_ERROR]', error);
    return false;
  }
}
