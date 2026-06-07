const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const desc = `We are looking for an experienced UI/UX Designer to join our team on a 3-month contract to redesign and modernize our mobile banking application. The app currently serves over 20,000 active users and requires a complete user experience overhaul to improve usability, customer engagement, accessibility, and conversion rates across key banking workflows.

The selected designer will work closely with our product manager, developers, and business stakeholders to redesign core user journeys including account onboarding, fund transfers, bill payments, savings products, transaction history, card management, and customer support interactions.

This is a remote position.

Responsibilities
Conduct UX audits on the existing mobile banking application.
Analyze user feedback and identify usability issues.
Create user flows, wireframes, and information architecture.
Design high-fidelity mobile screens and interactive prototypes.
Develop and maintain a scalable design system.
Collaborate closely with frontend developers during implementation.
Ensure designs meet accessibility and fintech compliance standards.
Participate in stakeholder reviews and incorporate feedback.

Requirements

Must Have
3+ years of experience designing mobile applications.
Strong portfolio demonstrating UX and visual design skills.
Advanced proficiency in Figma.
Experience creating design systems and reusable UI components.
Understanding of responsive and mobile-first design principles.
Ability to communicate design decisions clearly.

Preferred
Previous experience designing fintech, banking, payment, or financial products.
Familiarity with user research methodologies.
Experience conducting usability testing.
Understanding of accessibility standards (WCAG).
Knowledge of design handoff processes for development teams.

Please submit:
Portfolio link
Resume/CV
Examples of mobile applications you have designed
Brief description of any fintech or banking projects you have worked on
Your expected availability over the next 3 months`;

async function update() {
  await prisma.collab.updateMany({
    where: { title: 'UI/UX Designer for Fintech' },
    data: { description: desc }
  });
  console.log('Updated collabs');
}
update().finally(() => prisma.$disconnect());
