import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'apod';

  // NASA APOD - Astronomy Picture of the Day
  if (type === 'apod') {
    try {
      const key = process.env.NASA_API_KEY || 'DEMO_KEY';
      const r = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${key}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) {
        const d = await r.json();
        return NextResponse.json({
          title: d.title,
          explanation: d.explanation?.substring(0, 300) + '...',
          url: d.url,
          media_type: d.media_type,
          date: d.date,
          copyright: d.copyright || 'NASA',
        });
      }
    } catch {}
    return NextResponse.json({ error: 'NASA API unavailable' }, { status: 503 });
  }

  // ISS Location - no key needed
  if (type === 'iss') {
    try {
      const r = await fetch('http://api.open-notify.org/iss-now.json', {
        signal: AbortSignal.timeout(5000),
      });
      if (r.ok) {
        const d = await r.json();
        const lat = parseFloat(d.iss_position.latitude).toFixed(2);
        const lon = parseFloat(d.iss_position.longitude).toFixed(2);

        // Reverse geocode
        let location = `${lat}°, ${lon}°`;
        try {
          const geo = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { signal: AbortSignal.timeout(3000) }
          );
          if (geo.ok) {
            const g = await geo.json();
            location = g.address?.country || g.display_name?.split(',').pop()?.trim() || location;
          }
        } catch {}

        return NextResponse.json({
          lat, lon, location,
          timestamp: d.timestamp,
          speed: '27,600 km/h',
          altitude: '~408 km',
        });
      }
    } catch {}
    return NextResponse.json({ error: 'ISS API unavailable' }, { status: 503 });
  }

  // Mars weather (InSight)
  if (type === 'mars') {
    return NextResponse.json({
      message: 'Mars pe aaj bhi thand hai 🥶',
      temp: '-63°C average',
      fact: 'NASA InSight mission ne Mars ka pehla earthquake detect kiya tha!',
    });
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}
