"""
AI Service for generating student summaries using Google Gemini
"""
import google.generativeai as genai
import os
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_AI_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None
            print("⚠️ GOOGLE_AI_API_KEY not found. AI summaries will use template fallback.")

    async def generate_student_summary(self, student_data: Dict[str, Any]) -> str:
        """
        Generate AI-powered summary for a student
        """
        if not self.model:
            return self._generate_template_summary(student_data)

        try:
            # Prepare the prompt
            prompt = self._create_prompt(student_data)
            
            # Generate response
            response = self.model.generate_content(prompt)
            
            if response.text:
                # Clean up any markdown formatting that might still appear
                summary = response.text
                summary = summary.replace('**', '')  # Remove bold markdown
                summary = summary.replace('*', '')   # Remove italic markdown
                return summary
            else:
                return self._generate_template_summary(student_data)
                
        except Exception as e:
            print(f"Error generating AI summary: {e}")
            return self._generate_template_summary(student_data)

    def _create_prompt(self, student_data: Dict[str, Any]) -> str:
        """Create a detailed prompt for the AI"""
        student = student_data.get('student', {})
        communications = student_data.get('communications', [])
        interactions = student_data.get('interactions', [])
        notes = student_data.get('notes', [])
        
        # Convert Pydantic model to dict if needed
        if hasattr(student, 'dict'):
            student = student.dict()
        elif hasattr(student, '__dict__'):
            student = student.__dict__
        elif not isinstance(student, dict):
            # If it's still not a dict, convert it
            student = dict(student) if hasattr(student, '__iter__') else {}
        
        # Convert other Pydantic models to dicts
        def convert_to_dict(obj):
            if hasattr(obj, 'dict'):
                return obj.dict()
            elif hasattr(obj, '__dict__'):
                return obj.__dict__
            elif not isinstance(obj, dict):
                return dict(obj) if hasattr(obj, '__iter__') else {}
            return obj
        
        communications = [convert_to_dict(comm) for comm in communications]
        interactions = [convert_to_dict(interaction) for interaction in interactions]
        notes = [convert_to_dict(note) for note in notes]
        
        prompt = f"""
You are an AI assistant helping a college counseling team manage student applications. 
Generate a comprehensive, actionable summary for this student profile.

STUDENT PROFILE:
- Name: {student.get('name', 'Unknown')}
- Email: {student.get('email', 'Unknown')}
- Country: {student.get('country', 'Unknown')}
- Status: {student.get('status', 'Unknown')}
- Grade: {student.get('grade', 'Not specified')}
- High Intent: {student.get('high_intent', False)}
- Needs Essay Help: {student.get('needs_essay_help', False)}
- Last Active: {student.get('last_active', 'Unknown')}

RECENT COMMUNICATIONS ({len(communications)} total):
"""
        
        for comm in communications[:5]:  # Last 5 communications
            prompt += f"- {comm.get('communication_type', 'Unknown')}: {comm.get('subject', 'No subject')} ({comm.get('created_at', 'Unknown date')})\n"
            if comm.get('content'):
                prompt += f"  Content: {comm.get('content', '')[:200]}...\n"

        prompt += f"\nRECENT INTERACTIONS ({len(interactions)} total):\n"
        for interaction in interactions[:5]:  # Last 5 interactions
            prompt += f"- {interaction.get('type', 'Unknown')}: {interaction.get('detail', 'No details')} ({interaction.get('createdAt', 'Unknown date')})\n"

        prompt += f"\nINTERNAL NOTES ({len(notes)} total):\n"
        for note in notes[:3]:  # Last 3 notes
            prompt += f"- {note.get('content', note.get('text', 'No content'))[:200]}... ({note.get('created_at', 'Unknown date')})\n"

        prompt += """
Please provide a comprehensive summary that includes:

1. Student Overview: Brief profile summary and current status
2. Engagement Analysis: How actively the student is engaging
3. Communication Insights: Key patterns in communications
4. Progress Assessment: Where they are in the application process
5. Priority Level: Based on high intent and engagement
6. Actionable Recommendations: Specific next steps for the counseling team
7. Risk Factors: Any concerns or areas needing attention
8. Opportunities: Potential areas for improvement or engagement

IMPORTANT: Format the response in clean, readable text without any markdown formatting. Do NOT use asterisks (*), bold text, or any special characters. Use simple headings and bullet points for clarity. Write in plain text format only.

Be professional, concise, and focus on what the counseling team needs to know to help this student succeed.
"""

        return prompt

    def _generate_template_summary(self, student_data: Dict[str, Any]) -> str:
        """Fallback template-based summary when AI is not available"""
        student = student_data.get('student', {})
        communications = student_data.get('communications', [])
        interactions = student_data.get('interactions', [])
        notes = student_data.get('notes', [])
        
        # Convert Pydantic model to dict if needed
        if hasattr(student, 'dict'):
            student = student.dict()
        elif hasattr(student, '__dict__'):
            student = student.__dict__
        elif not isinstance(student, dict):
            # If it's still not a dict, convert it
            student = dict(student) if hasattr(student, '__iter__') else {}
        
        # Convert other Pydantic models to dicts
        def convert_to_dict(obj):
            if hasattr(obj, 'dict'):
                return obj.dict()
            elif hasattr(obj, '__dict__'):
                return obj.__dict__
            elif not isinstance(obj, dict):
                return dict(obj) if hasattr(obj, '__iter__') else {}
            return obj
        
        communications = [convert_to_dict(comm) for comm in communications]
        interactions = [convert_to_dict(interaction) for interaction in interactions]
        notes = [convert_to_dict(note) for note in notes]
        
        # This is the existing template logic from the frontend
        last_contacted = student.get('lastContactedAt')
        last_contacted_date = "Never"
        if last_contacted:
            if hasattr(last_contacted, 'toDate'):
                last_contacted_date = last_contacted.toDate().toLocaleDateString()
            elif isinstance(last_contacted, str):
                last_contacted_date = last_contacted
        
        summary = f"Student Profile Summary for {student.get('name', 'Unknown')}\n\n"
        
        # Basic info
        summary += f"Current Status: {student.get('status', 'Unknown')}\n"
        summary += f"Country: {student.get('country', 'Unknown')}\n"
        summary += f"Last Contacted: {last_contacted_date}\n"
        summary += f"Grade: {student.get('grade', 'Not specified')}\n\n"
        
        # Classification flags
        if student.get('high_intent') or student.get('needs_essay_help'):
            summary += "Key Classifications:\n"
            if student.get('high_intent'):
                summary += "• High Intent Student - Priority candidate\n"
            if student.get('needs_essay_help'):
                summary += "• Needs Essay Help - Requires additional support\n"
            summary += "\n"
        
        # Progress analysis
        stage_progress = ["Exploring", "Shortlisting", "Applying", "Submitted"]
        current_stage_index = stage_progress.index(student.get('status', '')) if student.get('status') in stage_progress else -1
        progress_percent = ((current_stage_index + 1) / len(stage_progress)) * 100 if current_stage_index >= 0 else 0
        
        summary += f"Application Progress: {progress_percent:.0f}% complete\n"
        summary += f"• Currently in: {student.get('status', 'Unknown')} stage\n"
        if current_stage_index < len(stage_progress) - 1:
            summary += f"• Next stage: {stage_progress[current_stage_index + 1]}\n"
        else:
            summary += "• Application completed!\n"
        summary += "\n"
        
        # Communication insights
        if communications:
            summary += f"Communication Activity: {len(communications)} total communications\n"
            channel_counts = {}
            for comm in communications:
                channel = comm.get('communication_type', comm.get('channel', 'unknown'))
                channel_counts[channel] = channel_counts.get(channel, 0) + 1
            
            summary += f"• Channel breakdown: {', '.join([f'{k.upper()}: {v}' for k, v in channel_counts.items()])}\n\n"
        else:
            summary += "Communication Activity: No communications recorded yet\n\n"
        
        # Interaction insights
        if interactions:
            summary += f"Student Engagement: {len(interactions)} recorded interactions\n"
            interaction_types = {}
            for interaction in interactions:
                interaction_type = interaction.get('type', 'unknown')
                interaction_types[interaction_type] = interaction_types.get(interaction_type, 0) + 1
            
            activity_types_str = ', '.join([f"{k.replace('_', ' ')}: {v}" for k, v in interaction_types.items()])
            summary += f"• Activity types: {activity_types_str}\n\n"
        else:
            summary += "Student Engagement: No interactions recorded yet\n\n"
        
        # Notes insights
        if notes:
            summary += f"Internal Notes: {len(notes)} notes on file\n\n"
        else:
            summary += "Internal Notes: No notes recorded yet\n\n"
        
        # Recommendations
        summary += "AI Recommendations:\n"
        
        if student.get('high_intent'):
            summary += "• Priority follow-up recommended - this is a high-intent student\n"
        
        if student.get('needs_essay_help'):
            summary += "• Consider offering essay writing support or resources\n"
        
        if last_contacted_date == "Never":
            summary += "• Immediate outreach needed - student has never been contacted\n"
        else:
            summary += "• Consider follow-up based on last contact date\n"
        
        if student.get('status') == "Exploring":
            summary += "• Focus on understanding student's goals and interests\n"
        elif student.get('status') == "Shortlisting":
            summary += "• Help with university selection and application strategy\n"
        elif student.get('status') == "Applying":
            summary += "• Provide application support and deadline management\n"
        elif student.get('status') == "Submitted":
            summary += "• Monitor application status and prepare for next steps\n"
        
        if not communications:
            summary += "• Initiate first contact to establish relationship\n"
        
        return summary

# Create singleton instance
ai_service = AIService()
