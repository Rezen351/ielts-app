import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;
    const speechEndpoint = process.env.AZURE_SPEECH_ENDPOINT;

    if (!speechKey || !speechRegion) {
        return NextResponse.json({ error: 'Missing Azure Speech credentials' }, { status: 500 });
    }

    const headers = { 
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    try {
        // Construct the correct token issuance URL
        let baseUrl = speechEndpoint ? speechEndpoint.replace(/\/$/, "") : `https://${speechRegion}.api.cognitive.microsoft.com`;
        
        // Ensure the token issuance path is correct for Cognitive Services endpoints
        const tokenUrl = `${baseUrl}/sts/v1.0/issueToken`;
        
        const tokenResponse = await axios.post(tokenUrl, null, { headers });
        return NextResponse.json({ token: tokenResponse.data, region: speechRegion });
    } catch (err: any) {
        console.error('Speech token error:', err.response?.data || err.message);
        return NextResponse.json({ error: 'There was an error retrieving your config.' }, { status: 401 });
    }
}
