College Football Big Ten Pick 'Em Portal
Overview
This project is a robust, scalable, and feature-rich web portal for a private College Football Pick 'Em league focused on the Big Ten Conference. It has been architected to support multiple, isolated leagues and historical seasons, providing a comprehensive platform for users to make picks, track their performance, and compete for weekly and season-long prizes. The core business logic has been migrated from the database to a dedicated API layer, making the application more maintainable and scalable. 




Key Features ✨

Multi-League & Multi-Season Support: The entire application is built around a powerful context system that allows users to seamlessly switch between different leagues they are a member of and view data from any historical season. 



Interactive Picks Page: Users can make and change their weekly picks on a user-friendly interface that provides instant visual feedback. After a week is finalized, picks are color-coded to visually indicate correct (green) and incorrect (red) selections. 


Comprehensive Commissioner Tools: League creators have access to a full admin dashboard to manage their league, including the ability to:

Settle weekly results and finalize winners. 

Correct game scores after they have been entered. 

Edit a user's pick in case of an error. 

Manage league-wide settings like the weekly buy-in or enabling "smack talk" mode. 


User Account Management: Users have a dedicated account page where they can securely change their password or permanently delete their own account through a two-step confirmation process. 


Dynamic Welcome Messages: The portal features a dynamic welcome message system that displays either a standard greeting or a "smack talk" message based on a setting controlled by the league commissioner. 

Tech Stack 🛠️

Frontend: React (built with Vite) 


Backend: JavaScript-based serverless functions running on Netlify Functions. 


Database: Supabase (PostgreSQL) 

Getting Started
Accessing the Portal
The application is designed to be accessed via a web browser. New users will need to register for an account and then either create a new league or join an existing one using a unique invite code.

Basic Usage

Navigate: After logging in, use the main navigation controls to select the league you want to view and the desired Season and Week. The entire user interface is context-aware and will update automatically based on your selections. 


Make Picks: Go to the "Picks" page to select the winning team for each game. Your selections are saved automatically. 

View Results: After the week's games have been settled by the commissioner, you can view the Leaderboard to see the weekly standings, check your Picks page to see your correct/incorrect results, or visit the Stats page for more detailed analytics.

Local Development Setup
For developers looking to run the project locally, please follow these steps to ensure a stable environment.

Prerequisites: Ensure you have Node.js and the npm package manager installed.

Installation: Clone the repository and install the required dependencies by running npm install in the project root.

Environment Variables: Create a .env file in the project root. This file is 

required to store all necessary secrets, such as the SUPABASE_SERVICE_KEY. This method is required because the 

netlify.toml environment injection was found to be unreliable. 


Running the Server: The local development server must be run with a specific, stable version of the Netlify CLI to avoid known tooling bugs. 

Required Netlify CLI Version: 17.22.1

Run Command: netlify dev

Project Status
The application is currently 

feature-complete based on the defined project scope. All major architectural refactoring has been finished, and the local development environment is stable. The final task required before the application can be considered "production-ready" is the final import and validation of historical game and pick data.