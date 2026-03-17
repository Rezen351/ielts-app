import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
        return NextResponse.json({ error: 'Missing Azure Speech credentials' }, { status: 500 });
    }

    const headers = { 
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    try {
        const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, { headers });
        return NextResponse.json({ token: tokenResponse.data, region: speechRegion });
    } catch (err: any) {
        console.error('Speech token error:', err.response?.data || err.message);
        return NextResponse.json({ error: 'There was an error retrieving your config.' }, { status: 401 });
    }
}
