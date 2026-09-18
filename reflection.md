## AI Usage Reflection

1. How did you break down the problem before prompting?

I separated the project into four areas: core task management, usability, gamification, and cloud authentication/synchronisation. The shipped application allows users to create, edit, prioritise, search, complete, and organise tasks by due date. It also includes reminders, Supabase cloud sync, Google authentication, and a garden-based reward system where completed tasks earn points according to priority.
Because these foundations were already in place, I asked the AI mainly to review the application against best practices and clearly explain its recommended changes before making them. This helped me compare each suggestion with my original scope instead of treating the AI as the decision-maker.

2. What did the AI get wrong, and how did you fix it?

The AI did not fully understand my intended depth of gamification because my initial description was too brief. Some suggestions assumed a more elaborate experience than the simple points-and-growing-tree system I intended for this version. I reviewed the recommendations against the project goals and retained the simpler implementation instead of expanding the scope without sufficient planning.
The AI also failed to highlight an important Google OAuth limitation: while the consent screen remains in testing mode, only users explicitly added in Google Cloud can sign in. This is unsuitable for broader testing because every test user must be manually authorised. I identified and documented this limitation during my own configuration and testing.
These issues reinforced that AI recommendations still require manual validation, especially where product intent and external-platform restrictions are involved.

3. What did you deliberately not delegate to AI, and why?

I did not provide the AI with secrets, API credentials, or direct access to my Supabase and Google configurations. I manually created and configured the services, including environment values, authentication providers, redirect URLs, and authorised test users. This reduced the risk of exposing credentials and ensured that I understood the security-sensitive parts of the system I shipped.

4. What would you do differently with more time?

I would define the gamification experience more precisely before implementation, including its progression, visuals, and required external tools. Richer assets or animations may require an image-generation or deployment platform, which was beyond this iteration.
I would also prepare Supabase, Google OAuth, and deployment requirements earlier. This would allow me to configure and test those services in parallel while the AI worked on the frontend, resulting in better collaboration and earlier discovery of integration constraints.