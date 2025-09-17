import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { studentData } = await request.json()
    
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
You are an AI assistant helping with student management for a college application consulting service. 
Analyze the following student data and provide a comprehensive summary with actionable recommendations.

Student Data:
${JSON.stringify(studentData, null, 2)}

Please provide a well-structured summary that includes:
1. **Student Overview** - Basic info and current status
2. **Key Insights** - Important patterns or flags
3. **Communication Analysis** - Activity levels and patterns
4. **Progress Assessment** - Where they are in the application process
5. **Actionable Recommendations** - Specific next steps for the counselor

Format the response in markdown with clear sections and bullet points. Be concise but comprehensive.
Focus on actionable insights that help the counselor provide better support.
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ summary: text })
  } catch (error) {
    console.error('Error generating AI summary:', error)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
