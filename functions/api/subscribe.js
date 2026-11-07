
export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  try {
    const origin = request.headers.get("Origin");
    const allowed = [
      "https://germanforjobs.com",
      "https://www.germanforjobs.com"
    ];

    if (origin && !allowed.includes(origin)) {
      return new Response(JSON.stringify({ error: "Invalid origin" }), {
        status: 403, headers
      });
    }

    if (!env.MAILERLITE_API_KEY || !env.MAILERLITE_GROUP_ID) {
      throw new Error("Missing MailerLite configuration");
    }

    const body = await request.json();
    const email = String(body.email || "").trim();

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers
      });
    }

    if (body.consent !== true) {
      return new Response(JSON.stringify({ error: "Consent required" }), {
        status: 400, headers
      });
    }

    const response = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.MAILERLITE_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        email,
        groups: [env.MAILERLITE_GROUP_ID],
        status: "unconfirmed"
      })
    });

    if (!response.ok) {
      console.error("MailerLite API error:", response.status);
      return new Response(JSON.stringify({ error: "Subscription failed" }), {
        status: 502, headers
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers
    });
  } catch (error) {
    console.error("Subscription error:", error.message);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers
    });
  }
}
