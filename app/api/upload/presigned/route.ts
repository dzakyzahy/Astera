import { type NextRequest } from 'next/server';
import { apiSuccess, handleRouteError, AsteraApiError } from '@/lib/api-response';
import { generateUploadUrl } from '@/lib/supabase-storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      throw new AsteraApiError(401, 'Unauthorized', 'You must be logged in to upload evidence.');
    }

    const { organizationId } = session.user as { organizationId: string };
    if (!organizationId) {
      throw new AsteraApiError(403, 'Forbidden', 'No organization assigned.');
    }

    const json = (await request.json()) as { filename?: string; incidentId?: string };
    const { filename, incidentId } = json;

    if (!filename) {
      throw new AsteraApiError(400, 'Bad Request', 'Filename is required.');
    }

    // Default bucket for evidence
    const bucketName = 'evidence';
    
    // Construct a secure path isolating by org and incident
    const path = `${organizationId}/${incidentId || 'general'}/${Date.now()}-${filename}`;
    
    const { signedUrl, path: storagePath } = await generateUploadUrl(bucketName, path);

    return apiSuccess({
      uploadUrl: signedUrl,
      path: storagePath,
      bucket: bucketName,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
