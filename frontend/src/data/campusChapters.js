/**
 * CollegeOS — 12 Scene Living Film Sequence (60 Seconds Total Cycle)
 * Subharti Polytechnic · Swami Vivekanand Subharti University
 *
 * 12 scenes, exactly 5.0 seconds each = 60.0s continuous real-time loop:
 *  1. 8:00 AM — Arrival at College Gate
 *  2. 8:05 AM — Walks across Campus Promenade
 *  3. 8:10 AM — Enters Main Academic Building
 *  4. 8:15 AM — Meets New Classmates in Atrium
 *  5. 8:20 AM — Enters the Classroom
 *  6. 8:25 AM — Attends Digital Electronics Lecture
 *  7. 8:30 AM — Works on Computer in High-Tech Lab
 *  8. 8:35 AM — Practices Coding & Simulation
 *  9. 8:40 AM — Meets Friends in Campus Cafeteria
 * 10. 8:45 AM — Explores the Central Library
 * 11. 8:50 AM — Afternoon Stroll Around Campus
 * 12. 9:00 AM — Leaves College & Smooth Loop Transition
 */

export const CAMPUS_CHAPTERS = [
  {
    id: "gate_arrival",
    chapter: 1,
    time: "8:00 AM",
    title: "Arrival at College Gate",
    desc: "Student arrives at the Subharti Polytechnic main gate, starting a new day.",
    t0: 0.0,
    t1: 5.0
  },
  {
    id: "campus_walk",
    chapter: 2,
    time: "8:05 AM",
    title: "Campus Promenade Walk",
    desc: "Walking past the lush central gardens, grand fountain, and green lawns.",
    t0: 5.0,
    t1: 10.0
  },
  {
    id: "building_entry",
    chapter: 3,
    time: "8:10 AM",
    title: "Enters College Building",
    desc: "Entering the main academic building through the grand arched entrance.",
    t0: 10.0,
    t1: 15.0
  },
  {
    id: "meet_classmates",
    chapter: 4,
    time: "8:15 AM",
    title: "Meets New Classmates",
    desc: "Greeting peers in the central atrium foyer and exchanging course notes.",
    t0: 15.0,
    t1: 20.0
  },
  {
    id: "enter_classroom",
    chapter: 5,
    time: "8:20 AM",
    title: "Enters the Classroom",
    desc: "Heading into the lecture hall and settling into a front-row study desk.",
    t0: 20.0,
    t1: 25.0
  },
  {
    id: "attend_lecture",
    chapter: 6,
    time: "8:25 AM",
    title: "Attends a Lecture",
    desc: "Engaged in Digital Electronics, listening to the professor and raising hand.",
    t0: 25.0,
    t1: 30.0
  },
  {
    id: "lab_workstation",
    chapter: 7,
    time: "8:30 AM",
    title: "Works in Computer Lab",
    desc: "Booting up the dual-monitor workstation in the high-tech computer lab.",
    t0: 30.0,
    t1: 35.0
  },
  {
    id: "coding_practice",
    chapter: 8,
    time: "8:35 AM",
    title: "Practices Coding",
    desc: "Writing code, debugging algorithms, and running engineering simulations.",
    t0: 35.0,
    t1: 40.0
  },
  {
    id: "cafeteria_friends",
    chapter: 9,
    time: "8:40 AM",
    title: "Meets Friends in Cafeteria",
    desc: "Enjoying coffee, snacks, and lively project discussion in the campus café.",
    t0: 40.0,
    t1: 45.0
  },
  {
    id: "explore_library",
    chapter: 10,
    time: "8:45 AM",
    title: "Explores the Library",
    desc: "Browsing technical engineering shelves and studying reference texts.",
    t0: 45.0,
    t1: 50.0
  },
  {
    id: "afternoon_stroll",
    chapter: 11,
    time: "8:50 AM",
    title: "Afternoon Campus Stroll",
    desc: "Walking around the sports courtyard and sunny tree-lined avenues.",
    t0: 50.0,
    t1: 55.0
  },
  {
    id: "departure_loop",
    chapter: 12,
    time: "9:00 AM",
    title: "Leaves the College",
    desc: "Concluding a productive day and departing the gate, transitioning seamlessly.",
    t0: 55.0,
    t1: 60.0
  }
];

export const TOTAL_FILM_DURATION = 60.0;
export const SCENE_DURATION = 5.0;
