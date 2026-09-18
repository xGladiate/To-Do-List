## AI Usage Reflection

1. How did you break down the problem before prompting?

I first created the basic to-do-list structure so that I had a working foundation to evaluate. After that, I brainstormed possible improvements such as reminders, Google Calendar integration, Supabase authentication, cloud synchronisation, and gamification.

I used AI to explore these possibilities, recommend best practices, and explain what it proposed changing. I then considered each suggestion based on its usefulness, feasibility, and the time available. This iterative approach helped me develop the product direction from a functional starting point instead of committing too early to features I had not fully planned.

2. What did the AI get wrong, and how did you fix it?

The AI did not fully understand my intended depth of gamification because my initial description was too brief. The UI of the growing tree were more brief than I intended. I reviewed the recommendations against the project goals and retained the simpler implementation instead of expanding the scope without sufficient planning.

The AI also failed to highlight an important Google OAuth limitation: while the consent screen remains in testing mode, only users explicitly added in Google Cloud can sign in. This is unsuitable for broader testing because every test user must be manually authorised. As such, I have to remove this feature since it is not ready for testing.

These issues reinforced that AI recommendations still require manual validation, especially where product intent and external-platform restrictions are involved.

3. What did you deliberately not delegate to AI, and why?

I did not provide the AI with secrets, API credentials, or direct access to my Supabase and Google configurations. I manually created and configured the services, including environment values, authentication providers, redirect URLs, and authorised test users. This reduced the risk of exposing credentials and ensured that I understood the security-sensitive parts of the system I shipped.

4. What would you do differently with more time?

I would define the gamification experience more precisely before implementation, including its progression, visuals, and required external tools. Richer assets or animations may require an image-generation or deployment platform, which was beyond this iteration due to time and resource concerns.

I would also prepare Supabase, Google OAuth, and deployment requirements earlier. This would allow me to configure and test those services in parallel while the AI worked on the frontend, resulting in better collaboration and earlier discovery of integration constraints.