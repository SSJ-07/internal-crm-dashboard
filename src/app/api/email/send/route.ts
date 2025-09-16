import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const to = body.to as string
    const subject = (body.subject as string) || ""
    const html = (body.html as string) || ""
    const fromName = (body.fromName as string) || ""

    if (!to) {
      return NextResponse.json({ error: "Missing recipient email" }, { status: 400 })
    }
    if (!subject && !html) {
      return NextResponse.json({ error: "Empty email" }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    const FROM = process.env.EMAIL_FROM || "onboarding@resend.dev"
    
    if (!apiKey) {
      return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 })
    }

    // For now, send all emails to your Gmail instead of the actual recipient
    const actualRecipient = "sumedh.sa.jadhav@gmail.com"
    const fromAddress = fromName ? `${fromName} <${FROM}>` : FROM
    
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: actualRecipient,
        subject: `[TO: ${to}] ${subject}`,
        html: `<p><strong>Original recipient:</strong> ${to}</p><p><strong>From:</strong> ${fromName || "CRM Team"}</p><hr>${html}`,
      }),
    })

    const json = await resp.json()
    if (!resp.ok) {
      return NextResponse.json({ error: json?.message || "Failed to send" }, { status: 500 })
    }
    return NextResponse.json({ id: json?.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 })
  }
}
