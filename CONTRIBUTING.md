# Contributing to Ranktica AI

Thank you for contributing to Ranktica AI.

This document explains the development workflow, coding standards, and contribution process.

---

# Development Workflow

All changes must follow:


Create Branch

  ↓

Develop Feature

  ↓

Run Tests

  ↓

Create Pull Request

  ↓

Code Review

  ↓

Merge


---

# Branch Naming

Use clear branch names:

## Feature


feature/feature-name


Example:


feature/seo-agent


## Bug Fix


fix/issue-name


Example:


fix/auth-error


## Documentation


docs/document-name


Example:


docs/api-update


---

# Commit Messages

Use clear commit messages.

Format:


type: description


Examples:


feat: add AI campaign agent

fix: resolve authentication issue

docs: update API documentation

chore: update dependencies


---

# Pull Request Rules

Every Pull Request should include:

## Title

Clear description of the change.

Example:


feat: add content generation agent


---

## Description

Include:

- What changed
- Why it changed
- Testing completed
- Screenshots (if UI changes)

---

# Code Standards

Follow:

- TypeScript best practices
- Clean architecture principles
- Meaningful naming
- Reusable components
- Proper error handling

---

# Testing Requirements

Before submitting a Pull Request:

Run:

```bash
npm test

Check:

npm run lint

Build:

npm run build
AI Development Guidelines

For AI agents:

Every agent must define:

Purpose
Capabilities
Permissions
Limitations
Evaluation metrics

Example:

Agent:
SEO Agent

Purpose:
Improve search visibility

Allowed:
Keyword analysis
Content recommendations

Restricted:
Unauthorized website changes
Security Requirements

Never commit:

API keys
Passwords
Private credentials
Environment files

Use:

.env.example

for required variables.

Documentation Updates

Update documentation when adding:

New features
APIs
Architecture changes
AI agents
Database changes
Code Review

Reviewers check:

Code quality
Security
Performance
Tests
Documentation
Contribution Principles

Ranktica values:

Quality over speed
Security by design
Transparent development
Responsible AI
Continuous improvement
Getting Help

For questions:

Open a GitHub Discussion
Create an Issue
Review existing documentation
