# MOLİ

Turkish and English Grade 8 mathematics learning platform. The first working lesson explores slope through an interactive ramp.

## Deploy on Vercel

Import `Selcuk77/MOLI` as a new Vercel project. Use **Other** for Framework Preset, leave the Root Directory at the repository root, and leave build and install commands empty. The deployment configuration is in `vercel.json`. No environment variables are required for this prototype.

## Current functionality

- Turkish and English interface
- Interactive ramp with contextual scripted guidance
- Optional browser speech synthesis and speech recognition
- Prerequisite check and suggested learning path
- Multiple-choice feedback and saved open responses
- Weekly study plan and calendar export with reminders
- Text transcript export

## Current limits

This is a prototype. Guidance is scripted, not a connected AI model. Accounts, server persistence, teacher and parent access, background notifications, and rubric grading are not connected. Data is stored in the browser. Browser speech features depend on browser support; speech recognition may use the browser provider's service. No audio file is stored by this application.

## Local development

Serve this directory using a local static HTTP server, such as `python3 -m http.server 8000`, and open `http://localhost:8000`.

## Next development

Add authenticated student/parent/teacher roles, server-side data storage, AI voice tutoring, expert rubrics, and curriculum content. Never commit API keys. Add future service secrets through Vercel environment variables.
