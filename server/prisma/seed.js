const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Clean up
  await prisma.gigApplication.deleteMany();
  await prisma.gig.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Users
  const tunde = await prisma.user.create({
    data: {
      username: 'tunde_beats',
      email: 'tunde@example.com',
      passwordHash,
      role: 'CREATOR',
      category: 'Music Production',
      bio: 'Award-winning music producer based in Lagos. Specializing in Afrobeats and fusion sounds.',
      creativeMission: 'Bridging the gap between traditional African rhythms and modern global pop.',
      location: 'Lagos, Nigeria',
      skills: 'Ableton, FL Studio, Vocal Mixing, Sound Design',
      verified: true
    }
  });

  const nora = await prisma.user.create({
    data: {
      username: 'nora_lens',
      email: 'nora@example.com',
      passwordHash,
      role: 'CREATOR',
      category: 'Photography',
      bio: 'Documentary and portrait photographer. Capturing the soul of Nigerian street life.',
      location: 'Abuja, Nigeria',
      skills: 'Color Grading, Lighting, Street Photography'
    }
  });

  const agency = await prisma.user.create({
    data: {
      username: 'greoh_studios',
      email: 'agency@example.com',
      passwordHash,
      role: 'SCOUT',
      category: 'Film Production',
      bio: 'Lagos-based film production studio. Always scouting for fresh talent.',
      location: 'Lagos, Nigeria'
    }
  });

  // 2. Create Connections
  await prisma.connection.create({
    data: { senderId: tunde.id, receiverId: nora.id, status: 'ACCEPTED' }
  });

  // 3. Create Posts (Professional Samples)
  await prisma.post.create({
    data: {
      creatorId: tunde.id,
      contentType: 'TEXT',
      caption: '✨ UPDATE: Just wrapped up a recording session with a major artist from the UK. Can\'t wait for you guys to hear the fusion we created! #Afrobeats #NewMusic',
    }
  });

  await prisma.post.create({
    data: {
      creatorId: nora.id,
      contentType: 'IMAGE',
      caption: '📸 PROJECT: Just released my new photo series "Faces of Oshodi". Check out the full portfolio on my profile! #LagosPhotography #StreetLife',
      mediaUrl: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&q=80'
    }
  });

  await prisma.post.create({
    data: {
      creatorId: tunde.id,
      contentType: 'TEXT',
      caption: '🤝 COLLAB: Looking for a soulful female vocalist for a mid-tempo Afropop track. Must be based in Lagos for studio sessions. Send your portfolio! #SingerWanted #LagosMusic',
    }
  });

  // 4. Create Gigs
  await prisma.gig.create({
    data: {
      title: 'Lead Cinematographer for Web Series',
      description: 'We are looking for a creative cinematographer for an upcoming 6-part web series focused on tech in Lagos. Must have experience with RED or ARRI systems.',
      budget: '₦500,000 - ₦800,000',
      category: 'Film',
      location: 'Lagos',
      posterId: agency.id
    }
  });

  // 5. Create Portfolio Items
  await prisma.portfolioItem.create({
    data: {
      creatorId: tunde.id,
      mediaType: 'IMAGE',
      title: 'Album: African Giant (Assisted)',
      mediaUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80',
      caption: 'Served as an associate producer for several tracks on this Grammy-winning project.'
    }
  });

  console.log('Database seeded with professional creative ecosystem data!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
