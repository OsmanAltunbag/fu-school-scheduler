# Summary: School Timetabling System

## What This Feature Does

A full-stack web application that automates the creation of a weekly school timetable. An admin configures teachers (with availability), class groups, subjects, and courses, then clicks **"Generate Schedule"**. The system uses Google OR-Tools CP-SAT to find a feasible assignment and displays the result as an interactive grid. If no valid schedule exists, a human-readable conflict report explains why and suggests fixes.

## Why It Exists

Manual timetable planning leads to conflicts, wasted time, and errors. This system eliminates the manual process for schools with up to ~10 teachers and ~50 courses.

## Who Uses It

A single admin user (school administrator). No multi-user or authentication requirements in the MVP.

## Core Constraints Enforced

| # | Rule |
|---|------|
| C1 | A teacher is never placed in a slot they marked unavailable |
| C2 | A teacher teaches at most one course per time slot |
| C3 | A class group has at most one lesson per time slot |
| C4 | Each course appears exactly its required number of times per week |

## Key Numbers

- **40** fixed time slots (5 days × 8 periods)
- **10s** maximum solver timeout
- **4** entity types to configure: Teacher, ClassGroup, Subject, Course
- **21** functional requirements
- **4** user stories (2× P1, 2× P2)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | FastAPI (Python 3.11+), SQLAlchemy 2.0, Pydantic v2 |
| Solver | Google OR-Tools CP-SAT |
| Database | SQLite |
| Deploy | Vercel (frontend) + Render (backend) |

## Feature Branch

`001-school-scheduler`

## Status

Draft → In Development → Review → Done
