# Battle Page

A real-time multiplayer battle page built with Next.js and PartyKit. This project focuses on a fast, distraction-free player experience.

## Features & Recent Updates

* **Cleaner Layout:** Removed the top navbar and extra space on the right side to give the page a better, balanced look.
* **2D Graphics:** Replaced the 3D cube with a simple 2D version that works well and is easy to see.
* **Instant Start:** Removed the "ready up" step. Players can start the game right away without waiting.
* **Main Timer Focus:** The timer is now the center of attention. It is placed right at the center or top of the page.
* **Fewer Distractions:** Removed extra text prompts (like telling users to "press space" or other controls) so players can focus fully on the main timer.

## Tech Stack

* **Frontend:** [Next.js](https://nextjs.org/)
* **Real-time Backend:** [PartyKit](https://www.partykit.io/)

## Getting Started

To run this project on your local machine, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd <your-project-folder>
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

4. **Start the PartyKit server:**
   Open a new terminal window and run:
   ```bash
   npx partykit dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the battle page.
